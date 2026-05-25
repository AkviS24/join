import { Component, OnInit, inject, signal } from '@angular/core';
import { UserBadge } from '../../../services/userbadge';
import { Supabase } from '../../../services/supabase';
import { ContactsDetails } from '../contacts-details/contacts-details';
import { ContactForm } from '../contacts-forms/contacts-forms';
import { SvgDb } from '../../../shared/svg-db/svg-db';

@Component({
  selector: 'app-contacts',
  imports: [ContactsDetails, SvgDb, ContactForm],
  templateUrl: './contacts.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  styleUrl: './contacts.scss',
})
export class Contacts implements OnInit {
  supaDatabase = inject(Supabase);
  userBadgeService = inject(UserBadge);
  showAddContact = false;
  showEditContact = false;
  showContactTransfer = false;
  isImportingContacts = false;
  contactTransferMessage = '';
  contactTransferError = '';
  showToast = signal(false);
  private addContactHoldTimeout?: ReturnType<typeof setTimeout>;
  private suppressNextAddContactClick = false;
  private readonly addContactHoldDelay = 650;

  async ngOnInit() {
    await this.supaDatabase.getDemoData();
  }

  showDetails(user: { id: any }) {
    this.supaDatabase.selectUser(user);
  }

  startAddContactHold(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    this.clearAddContactHoldTimeout();
    this.addContactHoldTimeout = setTimeout(() => {
      this.suppressNextAddContactClick = true;
      this.openContactTransfer();
    }, this.addContactHoldDelay);
  }

  finishAddContactHold() {
    this.clearAddContactHoldTimeout();
  }

  handleAddContactButtonClick(event: Event) {
    event.stopPropagation();

    if (this.suppressNextAddContactClick) {
      event.preventDefault();
      this.suppressNextAddContactClick = false;
      return;
    }

    this.openAddContact();
  }

  private clearAddContactHoldTimeout() {
    if (!this.addContactHoldTimeout) return;

    clearTimeout(this.addContactHoldTimeout);
    this.addContactHoldTimeout = undefined;
  }

  openAddContact() {
    this.showAddContact = true;
  }

  openContactTransfer() {
    this.showAddContact = false;
    this.showEditContact = false;
    this.contactTransferMessage = '';
    this.contactTransferError = '';
    this.showContactTransfer = true;
  }

  closeContactTransfer() {
    if (this.isImportingContacts) return;

    this.showContactTransfer = false;
    this.contactTransferMessage = '';
    this.contactTransferError = '';
  }

  exportContacts() {
    const contacts = this.supaDatabase.demoDaten().map((contact) => ({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || 0,
    }));
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      contacts,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `join-contacts-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.contactTransferError = '';
    this.contactTransferMessage = `${contacts.length} contacts exported.`;
  }

  async importContacts(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || this.isImportingContacts) return;

    this.isImportingContacts = true;
    this.contactTransferMessage = '';
    this.contactTransferError = '';

    try {
      const importedData = JSON.parse(await file.text());
      const importedContacts = this.getImportedContactList(importedData).map((contact) =>
        this.normalizeImportedContact(contact)
      );
      const result = await this.supaDatabase.importContacts(importedContacts);

      if (result.error) {
        this.contactTransferError = 'Contacts could not be imported.';
        return;
      }

      this.contactTransferMessage = `${importedContacts.length} contacts imported.`;
    } catch (error) {
      this.contactTransferError = 'Invalid contact file.';
      console.error('Contact import failed:', error);
    } finally {
      input.value = '';
      this.isImportingContacts = false;
    }
  }

  private getImportedContactList(importedData: any): any[] {
    const contacts = Array.isArray(importedData) ? importedData : importedData?.contacts;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('No contacts found');
    }

    return contacts;
  }

  private normalizeImportedContact(contact: any) {
    const name = String(contact?.name || '').trim();
    const email = String(contact?.email || '').trim();

    if (!name || !email) {
      throw new Error('Contact is missing required fields');
    }

    return {
      name,
      email,
      phone: Number(String(contact?.phone || '').replace(/\D/g, '')) || 0,
      password: '',
    };
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

  closeEditContact(wasSaved: boolean = false) {
    this.showEditContact = false;

    if (wasSaved) {
      this.triggerToast();
    }
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
      await this.supaDatabase.deleteContact(current);
      this.supaDatabase.selectUser(null);
      await this.supaDatabase.getDemoData();
    }
  }

  backToMain() {
    this.supaDatabase.selectedUser.set(null);
  }


}
