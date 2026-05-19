import { Component, inject } from '@angular/core';
import { Tasks } from '../../../services/tasks';
import { UserBadge } from '../../../services/userbadge';
import { SvgDb } from '../../../shared/svg-db/svg-db';
import { Board } from '../board/board';

type DetailSubtask = {
  subtaskText?: string;
  title?: string;
  completed?: boolean;
  done?: boolean;
};

type DetailTask = {
  id: number;
  title: string;
  description: string;
  category?: string;
  type: string;
  dueDate?: string;
  due_date: string;
  priority: string;
  assignedTo?: number[];
  assignedToNames?: string[];
  subtasks?: DetailSubtask[];
  status?: string;
};

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
  isDeleting = false;

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-EN');
  }

  formatType(type: string) {
    if (!type) return '';

    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  getTaskTypeClass(type: string) {
    return type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/\s+/g, '-');
  }

  getSubtaskText(subtask: DetailSubtask) {
    return subtask.subtaskText || subtask.title || '';
  }

  isSubtaskCompleted(subtask: DetailSubtask) {
    return Boolean(subtask.completed ?? subtask.done);
  }

  startEdit(task: DetailTask) {
    this.boardTS.openEditTask(task);
  }

  async toggleSubtask(task: DetailTask, index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const previousSubtasks = task.subtasks ? [...task.subtasks] : [];

    const subtasks = previousSubtasks.map((subtask, subtaskIndex) => {
      if (subtaskIndex !== index) return subtask;

      return {
        ...subtask,
        completed: input.checked,
      };
    });

    task.subtasks = subtasks;

    const { error } = await this.taskService.supabase
      .from('tasks')
      .update({ subtasks })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating subtask:', error);
      task.subtasks = previousSubtasks;
      input.checked = this.isSubtaskCompleted(previousSubtasks[index]);
      return;
    }

    await this.taskService.getTasks();
  }

  async deleteTasks(id: number) {
    if (this.isDeleting) return;

    this.isDeleting = true;

    const { error } = await this.taskService.supabase.from('tasks').delete().eq('id', id);

    this.isDeleting = false;

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    await this.taskService.getTasks();
    this.boardTS.closeDetails();
  }
}