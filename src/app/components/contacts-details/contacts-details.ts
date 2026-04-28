import { Component, inject, Input } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-contacts-details',
  imports: [],
  templateUrl: './contacts-details.html',
  styleUrl: './contacts-details.scss',
})
export class ContactsDetails {
  demoDB = inject(Supabase);
  nameColorService = inject(UserBadge);
  @Input() selectedUser: any = null;

}
