import { Component, inject } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { Supabase } from '../../services/supabase';
import { ContactsDetails } from "../contacts-details/contacts-details";

@Component({
  selector: 'app-contacts',
  imports: [ContactsDetails],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})

export class Contacts {
  demoDB = inject(Supabase);
  nameColorService = inject(UserBadge);
  selectedUser: any = null;

  showDetails(user: { id: any}){
    this.selectedUser = user;
  }
}
