import { Component, inject, Input, Output, EventEmitter, ElementRef, HostListener, ViewChild } from '@angular/core';
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
  @ViewChild('moreOptions') moreOptions!: ElementRef;
  demoDB = inject(Supabase);
  userBadgeService = inject(UserBadge);
  showMoreOptions = false;
  @Input() selectedUser: any = null;
  @Output() backToMain = new EventEmitter<void>();

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.showMoreOptions) {
      const clickedInside = this.moreOptions.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.showMoreOptions = false;
      }
    }
  }

  goBack() {
    this.backToMain.emit();
  }

  toggleMoreOptions() {
    this.showMoreOptions = !this.showMoreOptions
    console.log(this.showMoreOptions);

  }

  editContacts() {

  }

  deleteContact() {

  }
}
