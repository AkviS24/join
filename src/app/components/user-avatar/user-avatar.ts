import { Component, HostListener, Injector, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-avatar',
  imports: [RouterLink],
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
})
export class UserAvatar implements OnInit {
  isMenuOpen = false;
  private injector = inject(Injector);
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
    const { Supabase } = await import('../../services/supabase');
    const supabaseService = this.injector.get(Supabase);

    await supabaseService.supabase.auth.signOut();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
