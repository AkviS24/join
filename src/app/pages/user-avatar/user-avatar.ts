import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-user-avatar',
  imports: [RouterLink],
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
})
export class UserAvatar implements OnInit {
  isMenuOpen = false;
  demoDB = inject(Supabase);
  router = inject(Router);
  userInitial: string = '';

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      this.userInitial = localStorage.getItem('userInitial') || '';
    }
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click')
  closeMenu() {
    this.isMenuOpen = false;
  }

  async logout() {
    await this.demoDB.supabase.auth.signOut();
    localStorage.clear();
    this.router.navigate(['/login'], { queryParams: { logout: 'success' } });
  }
}
