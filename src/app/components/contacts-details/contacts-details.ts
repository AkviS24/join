import { Component, inject, Input } from '@angular/core';
import { UserBadge } from '../../services/userbadge';
import { Supabase } from '../../services/supabase';
import { SvgDb } from "../../shared/svg-db/svg-db";

@Component({
  selector: 'app-contacts-details',
  imports: [SvgDb],
  templateUrl: './contacts-details.html',
  styleUrl: './contacts-details.scss',
})
export class ContactsDetails {
  demoDB = inject(Supabase);
  userBadgeService = inject(UserBadge);
  @Input() selectedUser: any = null;

}
