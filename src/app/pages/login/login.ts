import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';
import { SvgDb } from '../../shared/svg-db/svg-db';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SvgDb],
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
  showSignUpSuccessMessage = false;
  showOverlay = true;
  rememberMe = false;
  isSignUpMode = false;
  acceptTerms = false;
  isPasswordVisible = false;
  isConfirmPasswordVisible = false;
  loginSubmitted = false;
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  private failedLoginEmail = '';
  private failedLoginPassword = '';
  private signUpSuccessTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }

    this.route.queryParams.subscribe((params) => {
      if (params['deleted']) {
        this.successMessage = 'Your account has been deleted.';
      }

      if (!params['logout'] && !params['deleted']) return;

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { logout: null, deleted: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
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
    this.loginSubmitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  disableAutofill(event: Event) {
    (event.target as HTMLInputElement).removeAttribute('readonly');
  }

  updateEmail(value: string): void {
    this.email = value;
  }

  updatePassword(value: string): void {
    this.password = value;
  }

  backToLogin() {
    this.isSignUpMode = false;
    this.loginSubmitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
    this.name = '';
    this.confirmPassword = '';
    this.acceptTerms = false;
    this.isPasswordVisible = false;
    this.isConfirmPasswordVisible = false;
  }

  isFormValid(): boolean {
    const email = this.email.trim();
    return (
      this.name.trim().length >= 3 &&
      this.emailPattern.test(email) &&
      this.passwordPattern.test(this.password) &&
      this.password === this.confirmPassword &&
      this.acceptTerms
    );
  }

  isLoginFormValid(): boolean {
    return this.emailPattern.test(this.email.trim()) && this.password.length > 0;
  }

  getInputState(field: 'name' | 'email' | 'password' | 'confirmPassword'): string {
    const value = this[field].trim();
    if (!value) return '';
    if (field === 'name' && value.length < 3) return 'has-error';
    if (field === 'email' && !this.emailPattern.test(value)) return 'has-error';
    if (field === 'password' && !this.passwordPattern.test(value)) return 'has-error';
    if ( field === 'confirmPassword' && this.password && value !== this.password) return 'has-error';
    return 'has-value';
  }

  getSignUpHint(inputField: 'name' | 'email' | 'password' | 'confirmPassword'): string {
    if (!this.name && !this.email && !this.password && !this.confirmPassword) {
      return '';
    }

    if (this.name.trim().length < 3 && (inputField === 'name')) {
      return 'The name needs at least 3 characters';
    }

    if (!this.emailPattern.test(this.email) && (inputField === 'email')) {
      return 'Please enter a valid email address';
    }

    if (!this.passwordPattern.test(this.password) && (inputField === 'password')) {
      return 'Needs uppercase, number, symbol';
    }

    if (this.password !== this.confirmPassword && (inputField === 'confirmPassword')) {
      return 'The passwords do not match';
    }
    return '';
  }

  async registerUser(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
    this.loginSubmitted = false;

    if (!this.isFormValid()) {
      this.errorMessage ='Please fill in all fields correctly and accept the Privacy Policy.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'The passwords do not match!';
      return;
    }

    try {
      const email = this.email.trim();
      const name = this.name.trim();
      const { data, error } = await this.supabaseService.supabase.auth.signUp({
        email,
        password: this.password,
        options: { data: { name } },
      });

      if (error) {
        this.errorMessage = error.message;
        return;
      }

      if (!data.user?.id) {
        this.errorMessage = 'Registration failed. Please try again.';
        return;
      }

      await this.supabaseService.setDemoData({
        auth_user_id: data.user.id,
        name,
        email,
        phone: 0,
        password: '',
      });

      await this.supabaseService.getDemoData();
      this.isSignUpMode = false;
      this.name = '';
      this.confirmPassword = '';
      this.acceptTerms = false;
      this.password = '';
      this.showSignUpSuccessAnimation();
    } catch (e: any) {
      this.errorMessage = 'An unexpected error occurred: ' + (e.message || e);
      console.error('Registration error', e);
    }
  }

  async loginUser(): Promise<void> {
    this.loginSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
    const email = this.email.trim();

    if (!email || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    if (!this.emailPattern.test(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    try {
      const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
        email,
        password: this.password,
      });

      if (error) {
        this.errorMessage = 'Check your email and password. Please try again';
        this.cdr.detectChanges();
        return;
      }

      if (data.user) {

        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const metadataName = data.user.user_metadata?.['name'];
        const userName =
          typeof metadataName === 'string' && metadataName.trim() ? metadataName.trim() : 'User';
        const userInitial = this.getUserInitial(userName);

        localStorage.setItem('userName', userName);
        localStorage.setItem('userInitial', userInitial);
        localStorage.removeItem('joinIsGuest');

        this.router.navigate(['/summary'], { queryParams: { name: userName } });
      }

    } catch (e) {
      this.errorMessage = 'There was a problem logging in.';
      this.cdr.detectChanges();
      console.error('Login error', e);
    }
  }

  async guestLogin(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
    this.loginSubmitted = false;
    localStorage.setItem('userInitial', 'G');
    localStorage.setItem('userName', 'Guest');
    localStorage.setItem('joinIsGuest', 'true');
    this.router.navigate(['/summary']);
  }

  private getUserInitial(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');

    return initials || 'U';
  }

  private showSignUpSuccessAnimation() {
    this.hideSignUpSuccessMessage();
    this.showSignUpSuccessMessage = true;

    this.signUpSuccessTimeout = setTimeout(() => {
      this.showSignUpSuccessMessage = false;
      this.signUpSuccessTimeout = undefined;
    }, 1500);
  }

  private hideSignUpSuccessMessage() {
    if (this.signUpSuccessTimeout) {
      clearTimeout(this.signUpSuccessTimeout);
      this.signUpSuccessTimeout = undefined;
    }

    this.showSignUpSuccessMessage = false;
  }
}
