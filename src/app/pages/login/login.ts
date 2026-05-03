import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  email = '';
  password = '';
  name = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  showSuccessMessage = false;
  showOverlay = true;
  rememberMe = false;
  isSignUpMode = false;
  acceptTerms = false;
  isPasswordVisible = false;
  isConfirmPasswordVisible = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: Supabase,
  ) {}

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }

    this.route.queryParams.subscribe((params) => {
      const errorMessage = params['error'];
      if (errorMessage) {
        this.errorMessage = errorMessage;
      }
    });
  }

  hideOverlay() {
    this.showOverlay = false;
  }

  toggleRememberMe() {
    this.rememberMe = !this.rememberMe;
  }

  toggleSignUpMode() {
    this.isSignUpMode = true;
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  backToLogin() {
    this.isSignUpMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.showSuccessMessage = false;
    this.name = '';
    this.confirmPassword = '';
    this.acceptTerms = false;
    this.isPasswordVisible = false;
    this.isConfirmPasswordVisible = false;
  }

  isFormValid(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    return (
      this.name.trim().length >= 3 &&
      emailPattern.test(this.email) &&
      passwordPattern.test(this.password) &&
      this.password === this.confirmPassword &&
      this.acceptTerms
    );
  }

  getSignUpHint(): string {
    if (!this.name && !this.email && !this.password && !this.confirmPassword) {
      return '';
    }

    if (this.name.trim().length < 3) {
      return 'Der Name muss mindestens 3 Zeichen lang sein.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(this.password)) {
      return 'Das Passwort muss mind. 8 Zeichen lang sein, Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.';
    }

    if (this.password !== this.confirmPassword) {
      return 'Die Passwörter stimmen nicht überein.';
    }

    if (!this.acceptTerms) {
      return 'Bitte akzeptiere die Privacy Policy, um fortzufahren.';
    }

    return '';
  }

  async registerUser(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid()) {
      this.errorMessage =
        this.getSignUpHint() ||
        'Bitte fülle alle Felder korrekt aus und akzeptiere die Privacy Policy.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein!';
      return;
    }

    try {
      const { data, error } = await this.supabaseService.supabase.auth.signUp({
        email: this.email,
        password: this.password,
        options: { data: { name: this.name } },
      });

      if (error) {
        this.errorMessage = error.message;
        return;
      }

      await this.supabaseService.setDemoData({
        name: this.name.trim() || '',
        email: this.email,
        phone: 0,
      });
      await this.supabaseService.getDemoData(); // Kontaktliste direkt updaten

      this.successMessage = ''; // Text entfernen, wir nutzen das SVG
      this.showSuccessMessage = true;
      setTimeout(async () => {
        this.showSuccessMessage = false;
        await this.loginUser();
      }, 2000);
    } catch (e: any) {
      this.errorMessage = 'Ein unerwarteter Fehler ist aufgetreten: ' + (e.message || e);
      console.error('Registration error', e);
    }
  }

  async loginUser(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Bitte E-Mail und Passwort eingeben.';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.errorMessage = 'Bitte eine gültige E-Mail-Adresse eingeben.';
      return;
    }

    try {
      const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
        email: this.email,
        password: this.password,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          this.errorMessage = 'Bitte bestätige zuerst deine E-Mail (Posteingang prüfen)!';
        } else {
          this.errorMessage = 'Login fehlgeschlagen: ' + error.message;
        }
        return;
      }

      if (data.user) {
        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const userName = data.user.user_metadata?.['name'] || 'User';
        const userInitial = userName
          .split(' ')
          .map((word: string) => word[0].toUpperCase())
          .join('');

        localStorage.setItem('userName', userName);
        localStorage.setItem('userInitial', userInitial);

        this.router.navigate(['/summary'], { queryParams: { name: userName } });
      }
    } catch (e) {
      this.errorMessage = 'Es gab ein Problem beim Login.';
      console.error('Login error', e);
    }
  }

  async guestLogin(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    localStorage.setItem('userInitial', 'G');
    localStorage.setItem('userName', 'Guest');
    this.router.navigate(['/summary']);
  }
}
