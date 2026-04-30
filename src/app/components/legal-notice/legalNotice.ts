import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-legal-notice',
  imports: [],
  templateUrl: './legalNotice.html',
  styleUrl: './legalNotice.scss',
})
export class LegalNotice {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
