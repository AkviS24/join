import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-contacts-add',
  imports: [FormsModule],
  templateUrl: './contacts-add.html',
  styleUrl: './contacts-add.scss',
})
export class ContactsAdd implements OnInit {
  @Input() user: any;
  @Output() closeEdit = new EventEmitter<void>();

  demoDB = inject(Supabase);

  contactName: string = '';
  contactEmail: string = '';
  contactPhone: string = '';
  isLoading: boolean = false;

  ngOnInit() {
    if (this.user) {
      this.contactName = this.fullName;
      this.contactEmail = this.user?.email && this.user.email !== 'null' ? this.user.email : '';
      this.contactPhone = this.user?.phone && this.user.phone !== 'null' ? this.user.phone : '';
    }
  }

  get fullName(): string {
    return this.user?.name === 'null' || !this.user?.name ? '' : this.user.name.trim();
  }

  get initials(): string {
    const nameStr = this.user?.name === 'null' || !this.user?.name ? '' : this.user.name.trim();
    if (!nameStr) return '';
    const parts = nameStr.split(' ').filter((n: string) => n.length > 0);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  }

  close() {
    this.closeEdit.emit();
  }

  async createContact() {
    if (this.isLoading) return;
    this.isLoading = true;

    const newContact = {
      name: this.contactName.trim() || '',
      email: this.contactEmail,
      phone: Number(this.contactPhone.replace(/\D/g, '')) || 0,
      password: 'defaultPassword'
    };

    await this.demoDB.setDemoData(newContact);
    await this.demoDB.getDemoData();
    this.isLoading = false;
    this.close();
  }
}
