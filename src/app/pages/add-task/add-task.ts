import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../services/supabase';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-task',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {
  supabaseService = inject(Supabase);
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

    const dbContacts = this.supabaseService.contacts ? this.supabaseService.contacts() : [];

    this.contacts = dbContacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: c.color || this.getColorForName(c.name),
      initials: c.initials || this.getInitials(c.name),
    }));
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
    event.stopPropagation(); // Verhindert das sofortige Schließen des Dropdowns
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
      alert('Bitte fülle alle Pflichtfelder (*) aus!');
      return;
    }
    const newTask = {
      id: new Date().getTime(),
      title: this.title,
      description: this.description,
      category: this.targetCategory,
      type: this.taskType,
      dueDate: this.dueDate,
      priority: this.selectedPriority,
      assignedTo: this.selectedContacts.map((c) => c.initials),
      assignedToNames: this.selectedContacts.map((c) => c.name),
      subtasks: [...this.newSubtasks],
    };

    await this.supabaseService.insertTask(newTask);

    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cancelAction();
      // Wenn wir nicht im Overlay sind, sondern auf der separaten Add-Task Seite: zurück zum Board!
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
