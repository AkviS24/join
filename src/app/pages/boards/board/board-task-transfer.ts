import { Injectable, inject, signal } from '@angular/core';
import { Tasks } from '../../../services/tasks';

@Injectable()
export class BoardTaskTransfer {
  private readonly taskService = inject(Tasks);

  readonly isImportingTasks = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  clearStatus() {
    this.message.set('');
    this.error.set('');
  }

  exportTasks() {
    const tasks = this.taskService.demoTasks().map((task) => this.getPortableTask(task));
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `join-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.error.set('');
    this.message.set(`${tasks.length} tasks exported.`);
  }

  async importTasks(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || this.isImportingTasks()) return;

    this.isImportingTasks.set(true);
    this.clearStatus();

    try {
      const importedData = JSON.parse(await file.text());
      const importedTasks = this.getImportedTaskList(importedData).map((task) =>
        this.normalizeImportedTask(task),
      );
      const result = await this.taskService.importTasks(importedTasks);

      if (result.error) {
        this.error.set('Tasks could not be imported.');
        return;
      }

      this.message.set(`${importedTasks.length} tasks imported.`);
    } catch (error) {
      this.error.set('Invalid task file.');
      console.error('Task import failed:', error);
    } finally {
      input.value = '';
      this.isImportingTasks.set(false);
    }
  }

  private getPortableTask(task: any) {
    return {
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'category-0',
      type: task.type || 'Technical Task',
      dueDate: task.dueDate || task.due_date || '',
      due_date: task.due_date || task.dueDate || '',
      priority: task.priority || 'medium',
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
      assignedToNames: Array.isArray(task.assignedToNames) ? task.assignedToNames : [],
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      status: task.status || 'todo',
    };
  }

  private getImportedTaskList(importedData: any): any[] {
    const tasks = Array.isArray(importedData) ? importedData : importedData?.tasks;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('No tasks found');
    }

    return tasks;
  }

  private normalizeImportedTask(task: any) {
    const dueDate = this.normalizeImportDate(task?.due_date || task?.dueDate);
    const title = String(task?.title || '').trim();
    const type = String(task?.type || '').trim();

    if (!title || !type || !dueDate) {
      throw new Error('Task is missing required fields');
    }

    return {
      title,
      description: String(task?.description || ''),
      category: String(task?.category || 'category-0'),
      type,
      dueDate,
      due_date: dueDate,
      priority: this.normalizeTaskPriority(task?.priority),
      assignedTo: this.normalizeNumberArray(task?.assignedTo),
      assignedToNames: this.normalizeStringArray(task?.assignedToNames),
      subtasks: this.normalizeSubtasks(task?.subtasks),
      status: this.normalizeTaskStatus(task?.status),
    };
  }

  private normalizeImportDate(value: unknown) {
    const dateText = String(value || '').trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
  }

  private normalizeTaskPriority(priority: unknown) {
    const value = String(priority || '');
    return ['urgent', 'medium', 'low'].includes(value) ? value : 'medium';
  }

  private normalizeTaskStatus(status: unknown) {
    const value = String(status || '');
    return ['todo', 'inProgress', 'awaitFeedback', 'done'].includes(value) ? value : 'todo';
  }

  private normalizeNumberArray(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  private normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value.map((item) => String(item));
  }

  private normalizeSubtasks(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
      .map((subtask) => ({
        subtaskText: String(subtask?.subtaskText || subtask?.title || '').trim(),
        completed: Boolean(subtask?.completed ?? subtask?.done),
      }))
      .filter((subtask) => subtask.subtaskText);
  }
}
