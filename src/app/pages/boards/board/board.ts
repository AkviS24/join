import { Component, inject, computed, signal } from '@angular/core';
import { Tasks } from '../../../services/tasks';
import { SvgDb } from "../../../shared/svg-db/svg-db";
import { UserBadge } from '../../../services/userbadge';
import { LowerCasePipe } from '@angular/common';
import { BoardDetails } from "../board-details/board-details";

@Component({
  selector: 'app-board',
  imports: [SvgDb, LowerCasePipe, BoardDetails],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  taskService = inject(Tasks);
  userBadgeService = inject(UserBadge);
  showDetails = false;
  selectedTaskId = signal<number | null>(null);

  boardSections = computed(() => [
    { id: 'toDo', label: 'To Do', tasks: this.toDoTasks() },
    { id: 'inProgress', label: 'In Progress', tasks: this.inProgressTasks() },
    { id: 'awaitFeedback', label: 'Await Feedback', tasks: this.awaitFeedbackTasks() },
    { id: 'done', label: 'Done', tasks: this.doneTasks() }
  ]);

  toDoTasks = computed(() =>
    this.taskService.demoTasks().filter(t => t.status === 'todo')
  );

  inProgressTasks = computed(() =>
    this.taskService.demoTasks().filter(t => t.status === 'inProgress')
  );

  awaitFeedbackTasks = computed(() =>
    this.taskService.demoTasks().filter(t => t.status === 'awaitFeedback')
  );

  doneTasks = computed(() =>
    this.taskService.demoTasks().filter(t => t.status === 'done')
  );

  selectedTask = computed(() =>
    this.taskService.demoTasks().find(t => t.id === this.selectedTaskId())
  );

  formatType(type: string): string {
    if (!type) return '';
    const result = type.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  getDoneSubtasksCount(task: any): number {
    return task.subtasks.filter((s: any) => s.status === 'done').length;
  }


  openTaskDetails(id: number) {
    this.selectedTaskId.set(id);
    this.showDetails = true;
  }

  close() {
    this.selectedTaskId.set(null);
    this.showDetails = false;
  }

  insertFunctionHere() {
  }
}
