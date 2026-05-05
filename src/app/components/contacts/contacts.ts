import { Component, inject, signal } from '@angular/core';
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
  showAddContact = false;
  showEditContact = false;
  showToast = signal(false);

  showDetails(user: { id: any }) {
    this.supaDatabase.selectUser(user);
  }

  openAddContact() {
    this.showAddContact = true;
  }

  closeAddContact(wasCreated: boolean = false) {
    this.showAddContact = false;
    if (wasCreated) {
      this.triggerToast();
    }
  }

  openEditContact() {
    this.showEditContact = true;
  }

  closeEditContact() {
    this.showEditContact = false;
  }

  triggerToast() {
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 1500);
  }

  async deleteContact() {
    const current = this.supaDatabase.selectedUser();
    if (current?.id) {
      await this.supaDatabase.deleteData(current.id);
      this.supaDatabase.selectUser(null);
    }
  }

  backToMain() {
    this.supaDatabase.selectedUser.set(null);
  }

  // async deleteContact() {
  //   if (this.selectedUser?.id) {
  //     await this.supaDatabase.deleteData(this.selectedUser.id);
  //     await this.supaDatabase.getDemoData();
  //     this.selectedUser = null;
  //   }
  // }
}
