import { Component, OnInit } from '@angular/core';
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
  ) {}

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
    this.clearFailedLogin();
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
    this.clearFailedLogin();
    this.name = '';
    this.confirmPassword = '';
    this.acceptTerms = false;
    this.isPasswordVisible = false;
    this.isConfirmPasswordVisible = false;
  }

  isFormValid(): boolean {
    const email = this.email.trim();

    // At least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 number, 1 special character.
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

    if (!this.isSignUpMode && this.loginSubmitted) {
      if (field === 'email' && (!value || !this.emailPattern.test(value))) return 'has-error';
      if (field === 'password' && !value) return 'has-error';
    }

    if (!value) return '';

    if (field === 'name' && this.isSignUpMode && value.length < 3) return 'has-error';
    if (field === 'email' && !this.emailPattern.test(value)) return 'has-error';
    if (field === 'password' && this.isSignUpMode && !this.passwordPattern.test(value)) {
      return 'has-error';
    }
    if (
      field === 'confirmPassword' &&
      this.isSignUpMode &&
      this.password &&
      value !== this.password
    ) {
      return 'has-error';
    }
    if (!this.isSignUpMode && this.isFailedLoginActive()) {
      return 'has-error';
    }

    return 'has-value';
  }

  getSignUpHint(): string {
    if (!this.name && !this.email && !this.password && !this.confirmPassword) {
      return '';
    }

    if (this.name.trim().length < 3) {
      return 'The name must be at least 3 characters long.';
    }

    if (!this.emailPattern.test(this.email)) {
      return 'Please enter a valid email address.';
    }

    if (!this.passwordPattern.test(this.password)) {
      return 'The password must be at least 8 characters long and include uppercase and lowercase letters, a number, and a special character.';
    }

    if (this.password !== this.confirmPassword) {
      return 'The passwords do not match.';
    }

    if (!this.acceptTerms) {
      return 'Please accept the Privacy Policy to continue.';
    }

    return '';
  }

  async registerUser(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
    this.loginSubmitted = false;
    this.clearFailedLogin();

    if (!this.isFormValid()) {
      this.errorMessage =
        this.getSignUpHint() ||
        'Please fill in all fields correctly and accept the Privacy Policy.';
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
    this.clearFailedLogin();

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
        this.setFailedLogin();
        this.errorMessage = this.getLoginErrorMessage(error.message);
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
      console.error('Login error', e);
    }
  }

  async guestLogin(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.hideSignUpSuccessMessage();
    this.loginSubmitted = false;
    this.clearFailedLogin();

    
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

  getVisibleErrorMessage(): string {
    if (!this.errorMessage) return '';

    if (!this.isSignUpMode && this.hasFailedLogin()) {
      return this.isFailedLoginActive() ? this.errorMessage : '';
    }

    if (!this.isSignUpMode && this.errorMessage === 'Please enter a valid email address.') {
      return this.emailPattern.test(this.email.trim()) ? '' : this.errorMessage;
    }

    if (!this.isSignUpMode && this.errorMessage === 'Please enter email and password.') {
      return this.email.trim() && this.password ? '' : this.errorMessage;
    }

    return this.errorMessage;
  }

  private getLoginErrorMessage(message: string): string {
    const normalizedMessage = message.toLowerCase();

    if (message === 'Email not confirmed') {
      return 'Please confirm your email first. Check your inbox!';
    }

    if (normalizedMessage.includes('invalid login credentials')) {
      return 'Check your email and password. Please try again.';
    }

    return 'Login failed: ' + message;
  }

  private setFailedLogin() {
    this.failedLoginEmail = this.email.trim();
    this.failedLoginPassword = this.password;
  }

  private clearFailedLogin() {
    this.failedLoginEmail = '';
    this.failedLoginPassword = '';
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

  private hasFailedLogin() {
    return Boolean(this.failedLoginEmail || this.failedLoginPassword);
  }

  private isFailedLoginActive() {
    return (
      this.hasFailedLogin() &&
      this.email.trim() === this.failedLoginEmail &&
      this.password === this.failedLoginPassword
    );
  }
}
