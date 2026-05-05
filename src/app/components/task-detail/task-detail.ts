import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Subtask {
  subtaskText: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string; // 'User Story' oder 'Technical Task'
  dueDate: string;
  priority: string; // 'low', 'medium', 'urgent'
  assignedTo: string[]; // Kürzel
  assignedToNames?: string[]; // Vollständige Namen passend zu den Kürzeln
  subtasks: Subtask[];
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail.html',
  styleUrls: ['./task-detail.scss'],
})
export class TaskDetail {
  @Input() task: Task | null = {
    id: 2,
    title: 'Kochwelt Page & Recipe Recommender',
    description: 'Build start page with recipe recommendation.',
    category: 'category-1',
    type: 'User Story',
    dueDate: '10/05/2023',
    priority: 'medium',
    assignedTo: ['EM', 'MB', 'AM'],
    assignedToNames: ['Emmanuel Mauer', 'Marcel Bauer', 'Anton Mayer'],
    subtasks: [
      { subtaskText: 'Implement Recipe Recommendation', completed: true },
      { subtaskText: 'Start Page Layout', completed: false },
    ],
  };

  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();
  @Output() edit = new EventEmitter<Task>();

  closeDetail(): void {
    this.close.emit();
  }

  deleteTask(): void {
    if (this.task) {
      this.delete.emit(this.task.id);
    }
  }

  editTask(): void {
    if (this.task) {
      this.edit.emit(this.task);
    }
  }

  toggleSubtask(index: number): void {
    if (this.task && this.task.subtasks[index]) {
      this.task.subtasks[index].completed = !this.task.subtasks[index].completed;
    }
  }

  getPriorityIcon(priority: string): string {
    if (priority === 'low') return 'icons/img/low2.svg';
    if (priority === 'medium') return 'icons/img/medium2.svg';
    return 'icons/img/high2.svg';
  }

  getAvatarColor(index: number): string {
    const colors = ['#0190E0', '#EE00D6', '#FF7A00', '#FFBB2B', '#1FD7C1'];
    return colors[index % colors.length];
  }
}
