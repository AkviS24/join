import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';
import { TaskDetail } from '../task-detail/task-detail';

export interface Subtask {
  subtaskText: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  dueDate: string;
  priority: string;
  assignedTo: string[];
  assignedToNames?: string[];
  subtasks: Subtask[];
}

export interface TaskView extends Task {
  progress: number;
  progressText: string;
  priorityIcon: string;
}

export interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskDetail],
  templateUrl: './board.html',
  styleUrls: ['./board.scss'],
})
export class Board implements OnInit {
  supabaseService = inject(Supabase);

  categories: Category[] = [
    { id: 'category-0', name: 'To do' },
    { id: 'category-1', name: 'In progress' },
    { id: 'category-2', name: 'Await feedback' },
    { id: 'category-3', name: 'Done' },
  ];

  searchTerm = signal<string>('');
  currentDraggedElementId: number | null = null;
  hoveredCategoryId: string | null = null;
  isAddTaskModalOpen: boolean = false;
  selectedPriority: string = 'medium';

  editingTaskId: number | null = null;

  private _contacts = computed(() => {
    const rawContacts = this.supabaseService.demoDaten();
    return rawContacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: c.color || this.getColorForName(c.name),
      initials: c.initials || this.getInitials(c.name),
    }));
  });

  get contacts(): any[] {
    return this._contacts();
  }
  get tasks(): Task[] {
    return this.supabaseService.tasks();
  }

  tasksByCategory = computed(() => {
    const searchLower = this.searchTerm().toLowerCase();
    const allTasks = this.tasks;

    const grouped: Record<string, TaskView[]> = {};
    this.categories.forEach((c) => (grouped[c.id] = []));

    for (const task of allTasks) {
      const matchesSearch =
        (task.title || '').toLowerCase().includes(searchLower) ||
        (task.description || '').toLowerCase().includes(searchLower);

      if (matchesSearch) {
        let progress = 0;
        let progressText = '';
        if (task.subtasks && task.subtasks.length > 0) {
          const completed = task.subtasks.filter((s) => s.completed).length;
          progress = (completed / task.subtasks.length) * 100;
          progressText = `${completed}/${task.subtasks.length} Subtasks`;
        }

        const taskView: TaskView = {
          ...task,
          progress,
          progressText,
          priorityIcon: this.getPriorityIcon(task.priority),
        };

        if (!grouped[task.category]) {
          grouped[task.category] = [];
        }
        grouped[task.category].push(taskView);
      }
    }

    return grouped;
  });

  dropdownOpen = false;
  selectedContacts: any[] = [];
  isTaskDetailOpen: boolean = false;
  selectedTask: Task | null = null;
  showSuccessMessage: boolean = false;

  newTaskTitle = '';
  newTaskDescription = '';
  newTaskDueDate = '';
  newTaskType = '';
  newTaskCategory = 'category-0';
  newSubtaskText = '';
  newSubtasks: Subtask[] = [];
  errorMessage = '';

  async ngOnInit() {
    await this.loadTasks();
    await this.loadContacts();
  }

  async loadTasks() {
    await this.supabaseService.getTasks();
  }

  async loadContacts() {
    await this.supabaseService.getDemoData();
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getColorForName(name: string): string {
    const colors = [
      '#ff7a00',
      '#ff5eb3',
      '#6e52ff',
      '#9327FF',
      '#00BEE8',
      '#1FD7C1',
      '#FF745E',
      '#FFA35E',
      '#FC71FF',
      '#FFC701',
      '#0038FF',
      '#C3FF2B',
      '#FFE62B',
      '#FF4646',
      '#FFBB2B',
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleContact(contact: any, event: Event) {
    event.stopPropagation();
    const index = this.selectedContacts.findIndex((c) => c.id === contact.id);
    if (index === -1) {
      this.selectedContacts.push(contact);
    } else {
      this.selectedContacts.splice(index, 1);
    }
  }

  isSelected(contact: any) {
    return this.selectedContacts.some((c) => c.id === contact.id);
  }

  onDragStart(taskId: number, event: DragEvent): void {
    this.currentDraggedElementId = taskId;
    const target = event.currentTarget as HTMLElement;

    setTimeout(() => {
      target.classList.add('drag-placeholder-board');
    }, 0);
  }

  onDragOver(event: DragEvent, categoryId: string): void {
    event.preventDefault();
    this.hoveredCategoryId = categoryId;
  }

  async onDrop(categoryId: string) {
    this.hoveredCategoryId = null;
    if (this.currentDraggedElementId !== null) {
      const task = this.tasks.find((t) => t.id === this.currentDraggedElementId);
      if (task) {
        task.category = categoryId;
        await this.supabaseService.updateTask(task.id, { category: categoryId });
      }
      this.currentDraggedElementId = null;
    }
  }

  // Setzt den Platzhalter beim Loslassen zurück
  onDragEnd(event: DragEvent): void {
    this.currentDraggedElementId = null;
    this.hoveredCategoryId = null;
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-placeholder-board');
  }

  openCard(task: Task): void {
    this.selectedTask = task;
    this.isTaskDetailOpen = true;
  }

  closeTaskDetail(): void {
    this.isTaskDetailOpen = false;
    this.selectedTask = null;
  }

  addTask(categoryId: string = 'category-0'): void {
    this.newTaskCategory = categoryId;
    this.isAddTaskModalOpen = true;
  }

  openEditTaskModal(): void {
    if (!this.selectedTask) return;
    const task = this.selectedTask;

    this.editingTaskId = task.id;
    this.newTaskTitle = task.title;
    this.newTaskDescription = task.description || '';
    this.newTaskDueDate = task.dueDate;
    this.newTaskType = task.type;
    this.newTaskCategory = task.category;
    this.selectedPriority = task.priority;

    this.newSubtasks = task.subtasks ? task.subtasks.map((s) => ({ ...s })) : [];

    this.selectedContacts = this.contacts.filter((c) =>
      (task.assignedTo || []).includes(c.initials),
    );

    this.isTaskDetailOpen = false;
    this.isAddTaskModalOpen = true;
  }

  closeAddTaskModal(): void {
    this.isAddTaskModalOpen = false;
    this.editingTaskId = null;
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskDueDate = '';
    this.newTaskType = '';
    this.selectedContacts = [];
    this.selectedPriority = 'medium';
    this.newSubtaskText = '';
    this.newSubtasks = [];
    this.errorMessage = '';
  }

  async saveTaskFromBoard(): Promise<void> {
    if (!this.newTaskTitle || !this.newTaskDueDate || !this.newTaskType) {
      const missing = [];
      if (!this.newTaskTitle) missing.push('Title');
      if (!this.newTaskDueDate) missing.push('Due date');
      if (!this.newTaskType) missing.push('Category (Task Type)');

      this.errorMessage = `Bitte fülle alle Pflichtfelder (*) aus! (Noch leer: ${missing.join(', ')})`;
      return;
    }
    this.errorMessage = '';

    if (this.editingTaskId !== null) {
      const updatedTask: Partial<Task> = {
        title: this.newTaskTitle,
        description: this.newTaskDescription,
        category: this.newTaskCategory,
        type: this.newTaskType,
        dueDate: this.newTaskDueDate,
        priority: this.selectedPriority,
        assignedTo: this.selectedContacts.map((c) => c.initials),
        assignedToNames: this.selectedContacts.map((c) => c.name),
        subtasks: [...this.newSubtasks],
      };
      await this.supabaseService.updateTask(this.editingTaskId, updatedTask);
      await this.supabaseService.getTasks(); // Board sofort aktualisieren
    } else {
      const newTask: Omit<Task, 'id'> = {
        title: this.newTaskTitle,
        description: this.newTaskDescription,
        category: this.newTaskCategory,
        type: this.newTaskType,
        dueDate: this.newTaskDueDate,
        priority: this.selectedPriority,
        assignedTo: this.selectedContacts.map((c) => c.initials),
        assignedToNames: this.selectedContacts.map((c) => c.name),
        subtasks: [...this.newSubtasks],
      };
      await this.supabaseService.insertTask(newTask);
      await this.supabaseService.getTasks();
    }

    this.closeAddTaskModal();

    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 1500);
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.supabaseService.deleteTaskSupabase(taskId);
    await this.supabaseService.getTasks();
    this.closeTaskDetail();
  }

  selectPriority(priority: string): void {
    this.selectedPriority = priority;
  }

  getPriorityIcon(priority: string): string {
    if (priority === 'low') return 'icons/img/low2.svg';
    if (priority === 'medium') return 'icons/img/medium2.svg';
    return 'icons/img/high2.svg';
  }

  clearSubtaskInput() {
    this.newSubtaskText = '';
  }

  addSubtask() {
    if (this.newSubtaskText.trim()) {
      this.newSubtasks.push({ subtaskText: this.newSubtaskText.trim(), completed: false });
      this.newSubtaskText = '';
    }
  }

  editNewSubtask(index: number) {
    this.newSubtaskText = this.newSubtasks[index].subtaskText;
    this.newSubtasks.splice(index, 1);
  }

  removeNewSubtask(index: number) {
    this.newSubtasks.splice(index, 1);
  }
}
