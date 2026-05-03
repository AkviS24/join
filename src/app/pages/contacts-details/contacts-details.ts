import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserBadge } from '../../services/userbadge';
import { SvgDb } from '../../shared/svg-db/svg-db';

@Component({
  selector: 'app-contacts-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts-details.html',
  styleUrl: './contacts-details.scss',
})
export class ContactsDetails {
  @Input() user: any;
  @Output() editRequest = new EventEmitter<void>();
  @Output() deleteRequest = new EventEmitter<void>(); // <-- Hinzufügen
  @Output() backRequest = new EventEmitter<void>();

  userBadgeService = inject(UserBadge);

  isEditHovered = false;
  isDeleteHovered = false;
  showOptionsMenu = false;

  onEditClick() {
    this.editRequest.emit();
    this.showOptionsMenu = false;
  }

  onDeleteClick() {
    this.deleteRequest.emit();
    this.showOptionsMenu = false;
  }

  onBackClick() {
    this.backRequest.emit();
  }

  toggleOptionsMenu() {
    this.showOptionsMenu = !this.showOptionsMenu;
  }
}
