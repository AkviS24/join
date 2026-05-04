import { Component, inject } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { Supabase } from '../../services/supabase';
import { ContactsDetails } from '../contacts-details/contacts-details';
import { SvgDb } from '../../shared/svg-db/svg-db';
import { ContactsAdd } from '../contacts-add/contacts-add';
import { ContactsEdit } from '../contacts-edit/contacts-edit';

@Component({
  selector: 'app-contacts',
  imports: [ContactsDetails, SvgDb, ContactsAdd, ContactsEdit],
  templateUrl: './contacts.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  styleUrl: './contacts.scss',
})
export class Contacts {
  supaDatabase = inject(Supabase);
  userBadgeService = inject(UserBadge);
  selectedUser: any = null;
  showAddContact = false;
  showEditContact = false;

  showDetails(user: { id: any }) {
    this.selectedUser = user;
  }

  openAddContact() {
    this.showAddContact = true;
  }

  closeAddContact() {
    this.showAddContact = false;
  }

  openEditContact() {
    this.showEditContact = true;
  }

  closeEditContact() {
    this.showEditContact = false;
  }

  async deleteContact() {
    if (this.selectedUser?.id) {
      await this.supaDatabase.deleteData(this.selectedUser.id);
      await this.supaDatabase.getDemoData();
      this.selectedUser = null; // Detailansicht schließen, da der Kontakt gelöscht wurde
    }
  }
}
