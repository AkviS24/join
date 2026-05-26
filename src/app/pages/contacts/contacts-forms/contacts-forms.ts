import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Supabase } from '../../../services/supabase';
import { UserBadge } from '../../../services/userbadge';
import { SvgDb } from "../../../shared/svg-db/svg-db";

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [FormsModule, SvgDb],
  templateUrl: './contacts-forms.html',
  styleUrl: './contacts-forms.scss'
})
export class ContactForm implements OnInit {
  @Input() user: any = null;
  @Output() closeEdit = new EventEmitter<boolean>();
  @Output() accountDeleted = new EventEmitter<void>();

  supabase = inject(Supabase);
  userBadgeService = inject(UserBadge);

  contactName = '';
  contactEmail = '';
  contactPhone = '';
  isLoading = false;
  deleteError = '';

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
    return this.userBadgeService.getInitials(this.contactName || 'Guest');
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
      this.close(true);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteContact() {
    if (this.user?.id) {
      this.isLoading = true;
      this.deleteError = '';
      try {
        const deletedOwnAccount = await this.supabase.deleteContact(this.user);

        if (deletedOwnAccount) {
          this.accountDeleted.emit();
          return;
        }

        await this.supabase.getDemoData();
        this.close(true);
      } catch (error) {
        this.deleteError =
          error instanceof Error &&
          error.message === 'Only your own registered account can be deleted.'
            ? 'Registered users can delete only their own account.'
            : this.user.auth_user_id
              ? 'Your account could not be deleted. Please try again.'
              : 'The contact could not be deleted. Please try again.';
        console.error('Error deleting contact:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
