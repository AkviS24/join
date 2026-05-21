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
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

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
        this.successMessage = 'Successfully logged out.';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } else if (params['logout'] === 'inactivity') {
        this.errorMessage =
          'You were automatically logged out for security reasons due to inactivity.';

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

  disableAutofill(event: Event) {
    (event.target as HTMLInputElement).removeAttribute('readonly');
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
    if (!this.isSignUpMode && this.errorMessage.startsWith('Login failed')) {
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
        password: this.password,
      });
      
      await this.supabaseService.getDemoData();

      this.successMessage = 'Successfully registered! Please confirm your email, then log in.';
      this.isSignUpMode = false;
      this.name = '';
      this.confirmPassword = '';
      this.acceptTerms = false;
      this.password = '';
    } catch (e: any) {
      this.errorMessage = 'An unexpected error occurred: ' + (e.message || e);
      console.error('Registration error', e);
    }
  }

  async loginUser(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.emailPattern.test(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    try {
      const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
        email: this.email.trim(),
        password: this.password,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          this.errorMessage = 'Please confirm your email first. Check your inbox!';
        } else {
          this.errorMessage = 'Login failed: ' + error.message;
        }
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
}
