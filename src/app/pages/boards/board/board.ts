import { Component, inject, computed, signal, HostListener, OnInit } from '@angular/core';
import { Tasks } from '../../../services/tasks';
import { SvgDb } from '../../../shared/svg-db/svg-db';
import { UserBadge } from '../../../services/userbadge';
import { LowerCasePipe } from '@angular/common';
import { BoardDetails } from '../board-details/board-details';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AddTask } from "../../add-task/add-task";

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [SvgDb, LowerCasePipe, BoardDetails, FormsModule, DragDropModule, AddTask],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})

export class Board implements OnInit {
  taskService = inject(Tasks);
  userBadgeService = inject(UserBadge);

  showDetails = false;
  addTask = false;
  selectedTaskId = signal<number | null>(null);
  searchQuery = signal('');

  async ngOnInit() {
    await this.taskService.getTasks();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.task-card') && !target.closest('.dialog-overlay')) {
      this.closeDetails();
      this.closeAddTask();
    }
  }

  private filterTasks(status: string) {
    const query = this.searchQuery().toLowerCase().trim();

    return this.taskService.demoTasks().filter((t) => {
      const matchesStatus = t.status === status;
      const matchesSearch =
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
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
    this.taskService.demoTasks().find((t) => t.id === this.selectedTaskId())
  );

  async drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.item.data;
      await this.taskService.updateTasksStatus(task.id, newStatus);
    }
  }

  formatType(type: string): string {
    if (!type) return '';

    const result = type.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  getDoneSubtasksCount(task: any): number {
    if (!task.subtasks) return 0;

    return task.subtasks.filter((s: any) => s.completed).length;
  }

  openTaskDetails(id: number) {
    this.selectedTaskId.set(id);
    this.showDetails = true;
  }

  closeDetails() {
    this.selectedTaskId.set(null);
    this.showDetails = false;
  }

  getOrientation() {
    return window.innerWidth <= 1200 ? 'horizontal' : 'vertical';
  }

  openAddTask() {
    this.addTask = true;
    console.log("hallo task");
  }

  closeAddTask() {
    this.addTask = false;
  }
}