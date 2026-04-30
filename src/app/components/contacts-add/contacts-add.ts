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
    const firstName =
      this.user?.firstname === 'null' || !this.user?.firstname ? '' : this.user.firstname;
    const lastName = this.user?.name === 'null' || !this.user?.name ? '' : this.user.name;
    return `${firstName} ${lastName}`.trim();
  }

  get initials(): string {
    const firstNameInitial =
      this.user?.firstname === 'null' || !this.user?.firstname ? '' : this.user.firstname[0];
    const lastNameInitial = this.user?.name === 'null' || !this.user?.name ? '' : this.user.name[0];
    return `${firstNameInitial}${lastNameInitial}`.trim();
  }

  close() {
    this.closeEdit.emit();
  }

  async createContact() {
    if (this.isLoading) return;
    this.isLoading = true;

    // Teilt Vorname und Nachname am ersten Leerzeichen
    const nameParts = this.contactName.trim().split(' ');
    const newContact = {
      firstname: nameParts[0] || '',
      name: nameParts.slice(1).join(' ') || '',
      email: this.contactEmail,
      phone: Number(this.contactPhone.replace(/\D/g, '')) || 0, 
    };

    await this.demoDB.setDemoData(newContact);
    await this.demoDB.getDemoData(); 
    this.isLoading = false;
    this.close();
  }
}
