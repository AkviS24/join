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
  }
}
