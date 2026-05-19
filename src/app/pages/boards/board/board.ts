import { Component, inject, computed, signal, HostListener, OnInit } from '@angular/core';
import { Tasks } from '../../../services/tasks';
import { SvgDb } from '../../../shared/svg-db/svg-db';
import { UserBadge } from '../../../services/userbadge';
import { LowerCasePipe } from '@angular/common';
import { BoardDetails } from '../board-details/board-details';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AddTask } from "../../add-task/add-task";
import { Router, RouterLink } from '@angular/router';

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
  router = inject(Router);
  showDetails = false;
  addingTask = false;
  isClosingDetails = false;
  isClosingAddTask = false;
  selectedTaskId = signal<number | null>(null);
  editingTask = signal<any | null>(null);
  searchQuery = signal('');
  currentAddTaskStatus = 'todo';

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

  async drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.item.data;
      await this.taskService.updateTasksStatus(task.id, newStatus);
    }
  }

  getTaskTypeClass(type: string): string {
    return type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/\s+/g, '-');
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
      this.currentAddTaskStatus = "todo";
      this.addingTask = false;
      this.isClosingAddTask = false;
    }, 200);
  }

  getOrientation() {
    return window.innerWidth <= 1200 ? 'horizontal' : 'vertical';
  }

  isMobileWidth() {
    return window.innerWidth <= 480 ? true : false;
  }
}
