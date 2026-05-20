import { Component, OnInit, OnChanges, SimpleChanges, inject, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../services/supabase';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserBadge } from '../../services/userbadge';
import { Tasks } from '../../services/tasks';
import { SvgDb } from "../../shared/svg-db/svg-db";

type EditableSubtask = {
  subtaskText?: string;
  title?: string;
  completed?: boolean;
  done?: boolean;
};

type EditableTask = {
  id: number;
  title: string;
  description: string;
  category?: string;
  type: string;
  dueDate?: string;
  due_date?: string;
  priority: string;
  assignedTo?: number[];
  assignedToNames?: string[];
  subtasks?: EditableSubtask[];
  status?: string;
};

@Component({
  selector: 'app-add-task',
  imports: [CommonModule, FormsModule, SvgDb],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit, OnChanges {
  supabaseService = inject(Supabase);
  tasksService = inject(Tasks);
  userBadgeService = inject(UserBadge);
  route = inject(ActivatedRoute);
  router = inject(Router);

  contacts: any[] = [];
  dropdownOpen = false;
  categoryDropdownOpen = false;
  selectedContacts: any[] = [];
  selectedPriority = 'medium';
  contactSearch = '';
  minDate = '';

  title = '';
  description = '';
  dueDate = '';
  taskType = '';
  newSubtaskText = '';
  errorMessage = '';
  newSubtasks: { subtaskText: string; completed: boolean }[] = [];
  showSuccessMessage = false;
  isSubmitted = false;
  addAwaitFeedback = false;
  addInProgress = false;

  @Input() targetCategory = 'category-0';
  @Input() asOverlay = false;
  @Input() editTask: EditableTask | null = null;
  @Input() initialStatus = 'todo';
  @Input() addingTaskInBoard = false;

  @Output('close') closeOverlay = new EventEmitter<void>();

  get isEditMode() {
    return Boolean(this.editTask);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editTask'] && this.contacts.length > 0) {
      this.fillFormFromEditTask();
    }
  }

  async ngOnInit() {
    this.getTodayDate();
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.targetCategory = params['category'];
      }
    });

    await this.supabaseService.getDemoData();

    const dbContacts = this.supabaseService.demoDaten();

    this.contacts = dbContacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: this.userBadgeService.getColor(c.id),
      initials: c.initials || this.userBadgeService.getInitials(c.name),
    }));

    this.fillFormFromEditTask();
  }

  getTodayDate() {
    this.minDate = new Date().toISOString().split('T')[0];
  }

  get filteredContacts() {
    const query = this.contactSearch.toLowerCase().trim();

    if (!query) {
      return this.contacts;
    }

    return this.contacts.filter((contact) =>
      contact.name.toLowerCase().includes(query)
    );
  }

  closeDropdowns() {
    this.dropdownOpen = false;
    this.categoryDropdownOpen = false;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.categoryDropdownOpen = false;
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

  toggleCategoryDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = false;
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  selectCategory(category: string, event: Event) {
    event.stopPropagation();
    this.taskType = category;
    this.categoryDropdownOpen = false;
  }

  selectPriority(priority: string) {
    this.selectedPriority = priority;
  }

  private getSubtaskText(subtask: EditableSubtask) {
    return subtask.subtaskText || subtask.title || '';
  }

  private isSubtaskCompleted(subtask: EditableSubtask) {
    return Boolean(subtask.completed ?? subtask.done);
  }

  private fillFormFromEditTask() {
    if (!this.editTask) return;

    this.title = this.editTask.title || '';
    this.description = this.editTask.description || '';
    this.dueDate = this.editTask.due_date || this.editTask.dueDate || '';
    this.taskType = this.editTask.type || '';
    this.targetCategory = this.editTask.category || this.targetCategory;
    this.selectedPriority = this.editTask.priority || 'medium';
    this.newSubtaskText = '';
    this.newSubtasks = (this.editTask.subtasks || []).map((subtask) => ({
      subtaskText: this.getSubtaskText(subtask),
      completed: this.isSubtaskCompleted(subtask),
    }));
    this.selectedContacts = (this.editTask.assignedTo || []).map((id, index) => {
      const existingContact = this.contacts.find((contact) => contact.id === id);

      if (existingContact) return existingContact;

      const name = this.editTask?.assignedToNames?.[index] || '';

      return {
        id,
        name,
        color: this.userBadgeService.getColor(id),
        initials: this.userBadgeService.getInitials(name),
      };
    });
    this.errorMessage = '';
    this.isSubmitted = false;
  }

  clearForm() {
    this.title = '';
    this.description = '';
    this.dueDate = '';
    this.taskType = '';
    this.selectedContacts = [];
    this.selectedPriority = 'medium';
    this.dropdownOpen = false;
    this.categoryDropdownOpen = false;
    this.contactSearch = '';
    this.newSubtaskText = '';
    this.newSubtasks = [];
    this.errorMessage = '';
    this.isSubmitted = false;
  }

  cancelAction() {
    this.clearForm();
    this.closeOverlay.emit();
  }

  private getTaskPayload(status: string) {
    return {
      title: this.title,
      description: this.description,
      category: this.targetCategory,
      type: this.taskType,
      dueDate: this.dueDate,
      due_date: this.dueDate,
      priority: this.selectedPriority,
      assignedTo: this.selectedContacts.map((c) => c.id),
      assignedToNames: this.selectedContacts.map((c) => c.name),
      subtasks: this.newSubtasks.map((subtask) => ({
        subtaskText: subtask.subtaskText,
        completed: subtask.completed,
      })),
      status,
    };
  }

  async submitTask() {
    if (this.isEditMode) {
      await this.updateTask();
      return;
    }

    await this.createTask();
  }

  async createTask() {
    this.isSubmitted = true;

    if (!this.title || !this.dueDate || !this.taskType) {
      this.errorMessage = 'Please fill in all required fields (*)!';
      return;
    }

    this.errorMessage = '';

    const taskStatus = this.initialStatus ? this.initialStatus : 'todo';

    await this.tasksService.setTasks(this.getTaskPayload(taskStatus));

    this.showSuccessMessage = true;

    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cancelAction();

      if (!this.asOverlay) {
        this.router.navigate(['/board']);
      }
    }, 1500);
  }

  async updateTask() {
    this.isSubmitted = true;

    if (!this.editTask || !this.title || !this.dueDate || !this.taskType) {
      this.errorMessage = 'Please fill in all required fields (*)!';
      return;
    }

    this.errorMessage = '';

    const result = await this.tasksService.getupdateTasks(
      this.editTask.id,
      this.getTaskPayload(this.editTask.status || 'todo')
    );

    if (result?.error) {
      this.errorMessage = 'Task could not be saved.';
      return;
    }

    this.showSuccessMessage = true;

    setTimeout(() => {
      this.showSuccessMessage = false;
      this.closeOverlay.emit();
    }, 1500);
  }

  clearSubtaskInput() {
    this.newSubtaskText = '';
  }

  addSubtask() {
    if (this.newSubtaskText.trim()) {
      this.newSubtasks.push({
        subtaskText: this.newSubtaskText.trim(),
        completed: false,
      });

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
