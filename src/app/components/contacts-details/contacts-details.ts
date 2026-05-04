import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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
  @Input() user: any;
  @Output() editRequest = new EventEmitter<void>();
  @Output() deleteRequest = new EventEmitter<void>(); // <-- Hinzufügen

  userBadgeService = inject(UserBadge);

  onEditClick() {
    this.editRequest.emit();
  }

  // Diese neue Methode sendet das Lösch-Event
  onDeleteClick() {
    this.deleteRequest.emit();
  }
}
