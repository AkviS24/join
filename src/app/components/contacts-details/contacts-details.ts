import { Component, EventEmitter, Input, ElementRef, HostListener, ViewChild, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserBadge } from '../../services/userbadge';
import { SvgDb } from '../../shared/svg-db/svg-db';

@Component({
  selector: 'app-contacts-details',
  standalone: true,
  imports: [CommonModule, SvgDb],
  templateUrl: './contacts-details.html',
  styleUrl: './contacts-details.scss',
})
export class ContactsDetails {
  @ViewChild('moreOptions') moreOptions!: ElementRef;
  @Input() user: any;
  @Output() editRequest = new EventEmitter<void>();
  @Output() deleteRequest = new EventEmitter<void>(); // <-- Hinzufügen

  userBadgeService = inject(UserBadge);
  showMoreOptions = false;

  onEditClick() {
    this.editRequest.emit();
  }
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
  // Diese neue Methode sendet das Lösch-Event
  onDeleteClick() {
    this.deleteRequest.emit();
  }
}
