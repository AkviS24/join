import { Component, computed, inject } from '@angular/core';
import { Tasks } from '../../../services/tasks';
import { UserBadge } from '../../../services/userbadge';
import { SvgDb } from '../../../shared/svg-db/svg-db';
import { Board } from '../board/board';

@Component({
  selector: 'app-board-details',
  imports: [SvgDb],
  templateUrl: './board-details.html',
  styleUrl: './board-details.scss',
})
export class BoardDetails {
  taskService = inject(Tasks);
  userBadgeService = inject(UserBadge);
  boardTS = inject(Board);


  formatDate(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-EN');
  }

  deleteTasks(id: number) {
    this.taskService.deleteData(id);
    this.boardTS.closeDetails();
  }

  updateTasks(id: number, demoData: {
    title: string,
    description: string,
    category: string,
    type: string,
    dueDate: string,
    due_date: string,
    priority: string;
    assignedTo: string[];
    assignedToNames: string[];
    subtasks: { subtaskText: string; completed: boolean }[];
    status: string;
  }) {
    this.taskService.getupdateTasks(id, demoData);
    this.boardTS.closeDetails();
  }
}
