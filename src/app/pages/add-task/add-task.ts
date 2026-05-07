import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../services/supabase';
import { Tasks } from '../../services/tasks';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserBadge } from '../../services/userbadge';

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
  selectedContacts: any[] = [];
  selectedPriority: string = 'medium';

  title = '';
  description = '';
  dueDate = '';
  taskType = '';
  newSubtaskText = '';
  newSubtasks: { subtaskText: string; completed: boolean }[] = [];
  showSuccessMessage: boolean = false;
  errorMessage: string = '';

  @Input() targetCategory: string = 'category-0';
  @Input() asOverlay: boolean = false;
  @Output() closeOverlay = new EventEmitter<void>();

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.targetCategory = params['category'];
      }
    });

    await this.supabaseService.getDemoData();

    const dbContacts = this.supabaseService.demoDaten();

    this.contacts = dbContacts.map((contact: any) => ({
      id: contact.id,
      name: contact.name,
      color: contact.color || this.userBadgeService.getColor(contact.id),
      initials: contact.initials || this.userBadgeService.getInitials(contact.name),
    }));
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleContact(contact: any, event: Event) {
    event.stopPropagation();

    const index = this.selectedContacts.findIndex((selectedContact) => {
      return selectedContact.id === contact.id;
    });

    if (index === -1) {
      this.selectedContacts.push(contact);
    } else {
      this.selectedContacts.splice(index, 1);
    }
  }

  isSelected(contact: any) {
    return this.selectedContacts.some((selectedContact) => {
      return selectedContact.id === contact.id;
    });
  }

  selectPriority(priority: string) {
    this.selectedPriority = priority;
  }

  cancelAction() {
    this.title = '';
    this.description = '';
    this.dueDate = '';
    this.taskType = '';
    this.selectedContacts = [];
    this.selectedPriority = 'medium';
    this.newSubtaskText = '';
    this.newSubtasks = [];
    this.errorMessage = '';

    if (this.asOverlay) {
      this.closeOverlay.emit();
    }
  }

  async createTask() {
    if (!this.title || !this.dueDate || !this.taskType) {
      this.errorMessage = 'Bitte fülle alle Pflichtfelder (*) aus!';
      return;
    }

    const newTask = {
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.targetCategory,
      type: this.taskType,
      dueDate: this.dueDate,
      due_date: this.dueDate,
      priority: this.selectedPriority,
      assignedTo: this.selectedContacts.map((contact) => contact.initials),
      assignedToNames: this.selectedContacts.map((contact) => contact.name),
      subtasks: [...this.newSubtasks],
      status: this.targetCategory,
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