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
      if (params['logout'] === 'success') {
        this.successMessage = 'Erfolgreich abgemeldet.';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } else if (params['logout'] === 'inactivity') {
        this.errorMessage =
          'Du wurdest aus Sicherheitsgründen wegen Inaktivität automatisch abgemeldet.';

        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
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
    this.name = '';
    this.confirmPassword = '';
    this.acceptTerms = false;
    this.isPasswordVisible = false;
    this.isConfirmPasswordVisible = false;
  }

  isFormValid(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Mind. 8 Zeichen, 1 Kleinbuchstabe, 1 Großbuchstabe, 1 Zahl, 1 Sonderzeichen
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
    // Zeige keinen Fehler an, wenn das Formular noch komplett leer ist
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

      // Speichere den neuen Benutzer zusätzlich in der demoDB-Tabelle
      await this.supabaseService.setDemoData({
        name: this.name.trim() || '',
        email: this.email,
        phone: 0,
        password: this.password,
      });
      // Aktualisiert die globale Kontaktliste (Signal) sofort
      await this.supabaseService.getDemoData();

      this.successMessage = 'Erfolgreich registriert! Logge ein...';
      setTimeout(async () => {
        await this.loginUser();
      }, 1500);
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

    // E-Mail-Format überprüfen
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
        // "Remember me" - Logik ausführen
        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Den Namen aus den Metadaten laden, die wir beim Signup gespeichert haben
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

    // Direkter Login ohne Datenbank-Abfrage
    localStorage.setItem('userInitial', 'G');
    localStorage.setItem('userName', 'Guest');
    this.router.navigate(['/summary']);
  }
}
