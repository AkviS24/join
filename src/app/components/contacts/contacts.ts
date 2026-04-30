import { Component, inject } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { ContactsDetails } from "../contacts-details/contacts-details";
import { SvgDb } from "../../shared/svg-db/svg-db";
import { JsonPipe } from '@angular/common';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-contacts',
  imports: [ContactsDetails, SvgDb, JsonPipe],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})

export class Contacts {
  supaDatabase = inject(Supabase);
  userBadgeService = inject(UserBadge);
  selectedUser: any = null;

  showDetails(user: { id: any }) {
    this.selectedUser = user;
  }

}
