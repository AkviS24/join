import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';
import { UserBadge } from '../../services/userbadge';

@Component({
  selector: 'app-contacts-edit',
  imports: [FormsModule],
  templateUrl: './contacts-edit.html',
  styleUrl: './contacts-edit.scss',
})
export class ContactsEdit implements OnInit {
  @Input() user: any;
  @Output() closeEdit = new EventEmitter<void>();

  demoDB = inject(Supabase);
  userBadgeService = inject(UserBadge);
  isDeleting: boolean = false;
  isSaving: boolean = false;

  contactName: string = '';
  contactEmail: string = '';
  contactPhone: number = 0;
  contactPassword: string = '';

  ngOnInit() {
    if (this.user) {
      this.contactName = this.user.name || '';
      this.contactEmail = this.user.email || '';
      this.contactPhone = this.user.phone || '';
      this.contactPassword = this.user.password || '';
    }
  }

  close() {
    this.closeEdit.emit();
  }

  async deleteContact() {
    if (!this.user?.id || this.isDeleting) return;
    this.isDeleting = true;

    await this.demoDB.deleteData(this.user.id);
    await this.demoDB.getDemoData();

    this.isDeleting = false;
    this.close();
  }

  async saveContact() {
    if (!this.user?.id || this.isSaving) return;
    this.isSaving = true;

    const phoneNum = Number(String(this.contactPhone).replace(/\D/g, '')) || 0;

    await this.demoDB.getupdateDemoData(
      this.user.id,
      this.contactName.trim(),
      this.contactEmail.trim(),
      phoneNum,
      this.contactPassword
    );
    await this.demoDB.getDemoData(); // Liste sofort aktualisieren

    this.isSaving = false;
    this.close(); // Fenster schließen
  }
}
