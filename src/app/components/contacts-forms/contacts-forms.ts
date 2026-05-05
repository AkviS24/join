import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Supabase } from '../../services/supabase';
import { UserBadge } from '../../services/userbadge';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contacts-forms.html',
  styleUrl: './contacts-forms.scss'
})
export class ContactForm implements OnInit {
  @Input() user: any = null;
  @Output() closeEdit = new EventEmitter<boolean>();

  supabase = inject(Supabase);
  userBadgeService = inject(UserBadge);

  contactName = '';
  contactEmail = '';
  contactPhone = '';
  isLoading = false;

  ngOnInit() {
    if (this.user) {
      this.contactName = this.user.name || '';
      this.contactEmail = this.user.email || '';
      this.contactPhone = this.user.phone?.toString() || '';
    }
  }

  get isEditMode(): boolean {
    return !!this.user;
  }

  get initials(): string {
    // Nutzt den Badge-Service für Edit oder generiert live Initialen für Add
    return this.userBadgeService.getInitials(this.contactName || '?');
  }

  close(wasSuccess = false) {
    this.closeEdit.emit(wasSuccess);
  }

  async submitForm(form: NgForm) {
    if (form.invalid || this.isLoading) return;
    this.isLoading = true;

    const contactData = {
      name: this.contactName.trim(),
      email: this.contactEmail.trim(),
      phone: Number(this.contactPhone.replace(/\D/g, '')),
      password: ''
    };

    try {
      if (this.isEditMode) {
        await this.supabase.getupdateDemoData(this.user.id, contactData.name, contactData.email, contactData.phone, '');
      } else {
        await this.supabase.setDemoData(contactData);
      }
      this.close(true); // Schließen mit Erfolg (für Toast)
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteContact() {
    if (this.user?.id) {
      this.isLoading = true;
      await this.supabase.deleteData(this.user.id);
      this.isLoading = false;
      this.close(true);
    }
  }
}