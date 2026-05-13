import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../services/supabase';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserBadge } from '../../services/userbadge';
import { Tasks } from '../../services/tasks';

@Component({
  selector: 'app-add-task',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {
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

  title = '';
  description = '';
  dueDate = '';
  taskType = '';
  newSubtaskText = '';
  newSubtasks: { subtaskText: string; completed: boolean }[] = [];
  showSuccessMessage = false;
  errorMessage = '';
  isSubmitted = false;

  @Input() targetCategory = 'category-0';
  @Input() asOverlay = false;
  @Output() closeOverlay = new EventEmitter<void>();

  async ngOnInit() {
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

  toggleCategoryDropdown() {
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

    if (this.asOverlay) {
      this.closeOverlay.emit();
    }
  }

  async createTask() {
    this.isSubmitted = true;

    if (!this.title || !this.dueDate || !this.taskType) {
      this.errorMessage = 'Please fill in all required fields (*)!';
      return;
    }

    this.errorMessage = '';

    const newTask = {
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
      status: 'todo',
    };

    await this.tasksService.setTasks(newTask);

    this.showSuccessMessage = true;

    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cancelAction();

      if (!this.asOverlay) {
        this.router.navigate(['/board']);
      }
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