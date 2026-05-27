import { Component, inject, computed, signal, HostBinding, HostListener } from '@angular/core';
import { Tasks } from '../../../services/tasks';
import { SvgDb } from '../../../shared/svg-db/svg-db';
import { UserBadge } from '../../../services/userbadge';
import { LowerCasePipe } from '@angular/common';
import { BoardDetails } from '../board-details/board-details';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, type DragStartDelay } from '@angular/cdk/drag-drop';
import { AddTask } from '../../add-task/add-task';
import { Router } from '@angular/router';
import { BoardTaskTransfer } from './board-task-transfer';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [SvgDb, LowerCasePipe, BoardDetails, FormsModule, DragDropModule, AddTask],
  providers: [BoardTaskTransfer,],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  taskService = inject(Tasks);
  userBadgeService = inject(UserBadge);
  router = inject(Router);
  taskTransfer = inject(BoardTaskTransfer);
  showDetails = false;
  addingTask = false;
  showTaskTransfer = false;
  isClosingDetails = false;
  isClosingAddTask = false;
  selectedTaskId = signal<number | null>(null);
  editingTask = signal<any | null>(null);
  searchQuery = signal('');
  private viewportWidth = signal(typeof window === 'undefined' ? 1024 : window.innerWidth);
  currentAddTaskStatus = 'todo';
  private addTaskHoldTimeout?: ReturnType<typeof setTimeout>;
  private suppressNextAddTaskClick = false;
  private readonly compactBoardBreakpoint = 1280;
  private readonly mobileNavigationBreakpoint = 480;
  // private readonly mobileDragMoveThreshold = 10;
  // private readonly mobileDragHoldDelay = 320;
  private readonly addTaskHoldDelay = 650;

  get taskDragStartDelay(): number {
    return this.usesHorizontalTaskScroller() ? 200 : 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.task-card') && !target.closest('.dialog-overlay')) {
      this.closeDetails();
      this.closeAddTask();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.viewportWidth.set(window.innerWidth);
  }

  boardSections = computed(() => [
    { id: 'todo', label: 'To Do', tasks: this.toDoTasks() },
    { id: 'inProgress', label: 'In Progress', tasks: this.inProgressTasks() },
    { id: 'awaitFeedback', label: 'Await Feedback', tasks: this.awaitFeedbackTasks() },
    { id: 'done', label: 'Done', tasks: this.doneTasks() },
  ]);

  toDoTasks = computed(() => this.filterTasks('todo'));
  inProgressTasks = computed(() => this.filterTasks('inProgress'));
  awaitFeedbackTasks = computed(() => this.filterTasks('awaitFeedback'));
  doneTasks = computed(() => this.filterTasks('done'));
  selectedTask = computed(() =>
    this.taskService.demoTasks().find((t) => t.id === this.selectedTaskId()),
  );

  private filterTasks(status: string) {
    const query = this.searchQuery().toLowerCase().trim();

    return this.taskService.demoTasks().filter((t) => {
      const matchesStatus = t.status === status;
      const matchesSearch =
        t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }

  async drop(event: CdkDragDrop<any[]>, newStatus: string) {
    const task = event.item.data;
    await this.taskService.moveTask(task.id, newStatus, event.currentIndex, event.container.data);
  }

  startAddTaskHold(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.clearAddTaskHoldTimeout();
    this.addTaskHoldTimeout = setTimeout(() => {
      this.suppressNextAddTaskClick = true;
      this.openTaskTransfer();
    }, this.addTaskHoldDelay);
  }

  finishAddTaskHold() {
    this.clearAddTaskHoldTimeout();
  }

  handleAddTaskButtonClick(event: Event) {
    event.stopPropagation();
    if (this.suppressNextAddTaskClick) {
      event.preventDefault();
      this.suppressNextAddTaskClick = false;
      return;
    }
    this.openAddTask();
  }

  private clearAddTaskHoldTimeout() {
    if (!this.addTaskHoldTimeout) return;
    clearTimeout(this.addTaskHoldTimeout);
    this.addTaskHoldTimeout = undefined;
  }

  openTaskTransfer() {
    this.closeDetails();
    this.closeAddTask();
    this.taskTransfer.clearStatus();
    this.showTaskTransfer = true;
  }

  closeTaskTransfer() {
    if (this.taskTransfer.isImportingTasks()) return;
    this.showTaskTransfer = false;
    this.taskTransfer.clearStatus();
  }

  getTaskTypeClass(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  getDoneSubtasksCount(task: any): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter((s: any) => s.completed).length;
  }

  openTaskDetails(id: number) {
    this.selectedTaskId.set(id);
    this.showDetails = true;
  }

  openEditTask(task: any) {
    this.editingTask.set(task);
    this.closeDetails();
    this.addingTask = true;
  }

  openAddTask(status: string = 'todo') {
    if (this.isMobileWidth()) {
      this.router.navigate(['/add-task']);
    } else {
      this.editingTask.set(null);
      this.addingTask = true;
      this.currentAddTaskStatus = status;
    }
  }

  closeDetails() {
    this.isClosingDetails = true;

    setTimeout(() => {
      this.showDetails = false;
      this.isClosingDetails = false;
    }, 200);
  }

  closeAddTask() {
    this.isClosingAddTask = true;
    setTimeout(() => {
      this.editingTask.set(null);
      this.currentAddTaskStatus = 'todo';
      this.addingTask = false;
      this.isClosingAddTask = false;
    }, 200);
  }

  getOrientation() {
    return this.usesHorizontalTaskScroller() ? 'horizontal' : 'vertical';
  }

  usesHorizontalTaskScroller() {
    return this.viewportWidth() <= this.compactBoardBreakpoint;
  }

  isMobileWidth() {
    return this.viewportWidth() <= this.mobileNavigationBreakpoint;
  }
}
