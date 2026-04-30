import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-contacts-edit',
  imports: [],
  templateUrl: './contacts-edit.html',
  styleUrl: './contacts-edit.scss',
})
export class ContactsEdit {
  @Input() user: any;
  @Output() closeEdit = new EventEmitter<void>();

  demoDB = inject(Supabase);
  isDeleting: boolean = false;

  close() {
    this.closeEdit.emit();
  }

  async deleteContact() {
    if (!this.user?.id || this.isDeleting) return;
    this.isDeleting = true;

    await this.demoDB.deleteDemoData(this.user.id);
    await this.demoDB.getDemoData(); // Aktualisiert die lokale Kontaktliste

    this.isDeleting = false;
    this.close();
  }
}
