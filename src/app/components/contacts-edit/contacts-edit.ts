import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';
import { UserBadge } from '../../services/userbadge';

@Component({
  selector: 'app-contacts-edit',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contacts-edit.html',
  styleUrl: './contacts-edit.scss',
})
export class ContactsEdit implements OnInit {
  @Input() user: any = null; // Wenn vorhanden -> Edit Mode, wenn null -> Add Mode
  @Output() closeEdit = new EventEmitter<void>();

  demoDB = inject(Supabase);
  userBadgeService = inject(UserBadge);

  isDeleting: boolean = false;
  isSaving: boolean = false;

  contactName: string = '';
  contactEmail: string = '';
  contactPhone: string = '';

  ngOnInit() {
    if (this.user) {
      // Edit-Modus: Bestehende Daten laden
      this.contactName = this.user.name === 'null' || !this.user.name ? '' : this.user.name.trim();
      this.contactEmail = this.user.email === 'null' || !this.user.email ? '' : this.user.email;
      this.contactPhone =
        this.user.phone === 'null' || !this.user.phone ? '' : String(this.user.phone);
    } else {
      // Add-Modus: Formular leeren
      this.contactName = '';
      this.contactEmail = '';
      this.contactPhone = '';
    }
  }

  get isEditMode(): boolean {
    return !!this.user?.id;
  }

  get initials(): string {
    if (this.isEditMode) {
      return this.userBadgeService.getInitials(this.contactName || this.user?.name);
    }
    const nameStr = this.contactName.trim();
    if (!nameStr) return '';
    const parts = nameStr.split(' ').filter((n: string) => n.length > 0);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  }

  get avatarColor(): string {
    if (this.isEditMode && this.user?.id) {
      return this.userBadgeService.getColor(this.user.id);
    }
    return '#d1d1d1'; // Standardfarbe für neue Kontakte
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
    if (this.isSaving) return;
    this.isSaving = true;

    const phoneClean = String(this.contactPhone).replace(/\D/g, '');
    const phoneNum = Number(phoneClean) || 0;

    if (this.isEditMode) {
      // Bestehenden Kontakt aktualisieren
      await this.demoDB.getupdateDemoData(
        this.user.id,
        this.contactName.trim(),
        this.contactEmail.trim(),
        phoneNum,
      );
    } else {
      // Neuen Kontakt erstellen
      const newContact = {
        name: this.contactName.trim(),
        email: this.contactEmail.trim(),
        phone: phoneNum,
      };
      await this.demoDB.setDemoData(newContact);
    }

    await this.demoDB.getDemoData(); // Liste aktualisieren
    this.isSaving = false;
    this.close();
  }
}
