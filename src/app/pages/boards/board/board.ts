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
  providers: [BoardTaskTransfer],
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
  draggingTaskId = signal<number | null>(null);
  activeMobileDropStatus = signal<string | null>(null);
  private viewportWidth = signal(typeof window === 'undefined' ? 1024 : window.innerWidth);
  currentAddTaskStatus = 'todo';
  private taskClickLocked = false;
  private dragHoldTimeout?: ReturnType<typeof setTimeout>;
  private mobileDragStartPoint?: { x: number; y: number };
  private addTaskHoldTimeout?: ReturnType<typeof setTimeout>;
  private suppressNextAddTaskClick = false;
  private lastDragReleaseAt = 0;
  private readonly compactBoardBreakpoint = 1280;
  private readonly mobileNavigationBreakpoint = 480;
  private readonly mobileDragMoveThreshold = 10;
  private readonly mobileDragHoldDelay = 320;
  private readonly addTaskHoldDelay = 650;
  readonly taskDragStartDelay: DragStartDelay = { touch: 260, mouse: 0 };

  @HostBinding('class.mobile-drag-active')
  get mobileDragActiveClass() {
    return this.mobileDragDockVisible();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.task-card') && !target.closest('.dialog-overlay')) {
      this.closeDetails();
      this.closeAddTask();
    }
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouchStart(event: TouchEvent) {
    this.prepareMobileTaskDrag(event);
  }

  @HostListener('document:touchmove', ['$event'])
  onDocumentTouchMove(event: TouchEvent) {
    this.handleMobileTaskTouchMove(event);
  }

  @HostListener('document:touchend')
  onDocumentTouchEnd() {
    void this.finishTaskDrag();
  }

  @HostListener('document:touchcancel')
  onDocumentTouchCancel() {
    this.resetMobileDragState();
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent) {
    this.updateActiveMobileDropStatus(event.clientX, event.clientY);
  }

  @HostListener('document:pointerup')
  onDocumentPointerRelease() {
    void this.finishTaskDrag();
  }

  @HostListener('document:pointercancel')
  onDocumentPointerCancel() {
    this.resetMobileDragState();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.viewportWidth.set(window.innerWidth);

    if (!this.isMobileWidth()) {
      this.resetMobileDragState();
    }
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

    const filteredTasks = this.taskService.demoTasks().filter((t) => {
      const matchesStatus = t.status === status;
      const matchesSearch =
        t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });

    return this.sortTasksByDueDate(filteredTasks);
  }

  async drop(event: CdkDragDrop<any[]>, newStatus: string) {
    const task = event.item.data;
    this.setActiveMobileDropStatus(null);

    if (event.previousContainer !== event.container && task.status !== newStatus) {
      await this.taskService.updateTasksStatus(task.id, newStatus);
    }
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

  private sortTasksByDueDate<T extends { due_date?: string; dueDate?: string; id?: number }>(
    tasks: T[],
  ): T[] {
    return [...tasks].sort((a, b) => {
      const dueDateDiff = this.getDueDateTime(a) - this.getDueDateTime(b);

      if (dueDateDiff !== 0) return dueDateDiff;

      return (a.id ?? 0) - (b.id ?? 0);
    });
  }

  private getDueDateTime(task: { due_date?: string; dueDate?: string }): number {
    const dueDate = task.due_date || task.dueDate;
    const dueDateTime = dueDate ? new Date(dueDate).getTime() : Number.POSITIVE_INFINITY;

    return Number.isNaN(dueDateTime) ? Number.POSITIVE_INFINITY : dueDateTime;
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
    if (this.taskClickLocked || Date.now() - this.lastDragReleaseAt < 250) return;

    this.selectedTaskId.set(id);
    this.showDetails = true;
  }

  prepareMobileTaskDrag(event: TouchEvent) {
    if (!this.isMobileWidth()) return;

    const touch = event.touches[0];
    const target = event.target;
    const taskCard = target instanceof HTMLElement ? target.closest<HTMLElement>('.task-card') : null;
    const taskId = Number(taskCard?.dataset['taskId']);

    if (!touch || !taskId) return;

    this.clearDragHoldTimeout();
    this.mobileDragStartPoint = { x: touch.clientX, y: touch.clientY };
    this.dragHoldTimeout = setTimeout(() => {
      this.taskClickLocked = true;
      this.draggingTaskId.set(taskId);
      this.mobileDragStartPoint = undefined;
    }, this.mobileDragHoldDelay);
  }

  handleMobileTaskTouchMove(event: TouchEvent) {
    if (!this.isMobileWidth()) return;

    const touch = event.touches[0];

    if (!touch) return;

    if (this.mobileDragDockVisible()) {
      event.preventDefault();
      this.updateActiveMobileDropStatus(touch.clientX, touch.clientY);
      return;
    }

    if (!this.dragHoldTimeout || !this.mobileDragStartPoint) return;

    const movedX = Math.abs(touch.clientX - this.mobileDragStartPoint.x);
    const movedY = Math.abs(touch.clientY - this.mobileDragStartPoint.y);

    if (Math.max(movedX, movedY) > this.mobileDragMoveThreshold) {
      this.clearDragHoldTimeout();
      this.mobileDragStartPoint = undefined;
    }
  }

  async finishTaskDrag() {
    this.clearDragHoldTimeout();
    const taskId = this.draggingTaskId();
    const targetStatus = this.activeMobileDropStatus();

    if (this.draggingTaskId() !== null || this.taskClickLocked) {
      this.lastDragReleaseAt = Date.now();
    }

    this.resetMobileDragState();

    if (taskId === null || !targetStatus) return;

    const task = this.taskService.demoTasks().find((taskItem) => taskItem.id === taskId);

    if (task && task.status !== targetStatus) {
      await this.taskService.updateTasksStatus(task.id, targetStatus);
    }
  }

  resetMobileDragState() {
    this.clearDragHoldTimeout();
    this.mobileDragStartPoint = undefined;
    this.draggingTaskId.set(null);
    this.setActiveMobileDropStatus(null);

    setTimeout(() => {
      this.taskClickLocked = false;
    }, 250);
  }

  clearDragHoldTimeout() {
    if (!this.dragHoldTimeout) return;

    clearTimeout(this.dragHoldTimeout);
    this.dragHoldTimeout = undefined;
  }

  mobileDragDockVisible() {
    return this.draggingTaskId() !== null && this.isMobileWidth();
  }

  updateActiveMobileDropStatus(x: number, y: number) {
    if (!this.mobileDragDockVisible()) return;

    this.setActiveMobileDropStatus(this.getMobileDropStatusAtPoint(x, y));
  }

  private setActiveMobileDropStatus(status: string | null) {
    this.activeMobileDropStatus.set(status);

    document.querySelectorAll<HTMLElement>('.mobile-drop-zone').forEach((zone) => {
      zone.classList.toggle('mobile-drop-zone--active', zone.dataset['status'] === status);
    });
  }

  private getMobileDropStatusAtPoint(x: number, y: number): string | null {
    const dropZones = Array.from(document.querySelectorAll<HTMLElement>('.mobile-drop-zone'));
    const targetZone = dropZones.find((zone) => {
      const rect = zone.getBoundingClientRect();

      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });

    return targetZone?.dataset['status'] ?? null;
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
