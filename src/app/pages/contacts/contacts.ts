import { Component, inject } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { Supabase } from '../../services/supabase';
import { ContactsDetails } from '../contacts-details/contacts-details';
import { SvgDb } from '../../shared/svg-db/svg-db';
import { ContactsEdit } from '../contacts-edit/contacts-edit';

@Component({
  selector: 'app-contacts',
  imports: [ContactsDetails, SvgDb, ContactsEdit],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  demoDB = inject(Supabase);
  userBadgeService = inject(UserBadge);
  selectedUser: any = null;
  showAddContact = false;
  showEditContact = false;
  showMobileDetails = false;

  showDetails(user: { id: any }) {
    this.selectedUser = user;
    this.showMobileDetails = true;
  }

  closeMobileDetails() {
    this.showMobileDetails = false;
  }

  openAddContact() {
    this.selectedUser = null;
    this.showEditContact = true;
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
      await this.demoDB.deleteData(this.selectedUser.id);
      await this.demoDB.getDemoData();
      this.selectedUser = null; 
      this.showMobileDetails = false; 
    }
  }
}
