import { Component, inject } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { Supabase } from '../../services/supabase';
import { ContactsDetails } from "../contacts-details/contacts-details";
import { SvgDb } from "../../shared/svg-db/svg-db";

@Component({
  selector: 'app-contacts',
  imports: [ContactsDetails, SvgDb],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})

export class Contacts {
  demoDB = inject(Supabase);
  userBadgeService = inject(UserBadge);
  selectedUser: any = null;

  showDetails(user: { id: any}){
    this.selectedUser = user;
  }
}
