import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthApiService } from '../core/services/auth-api.service';
import { KeycloakService } from '../core/services/keycloak.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly keycloak = inject(KeycloakService);
  private readonly router = inject(Router);

  tab = signal<Tab>('login');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required],
  });

  switchTab(t: Tab): void {
    this.tab.set(t);
    this.error.set(null);
    this.success.set(null);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.loginForm.value;
    this.authApi.login(username!, password!).subscribe({
      next: tokens => {
        this.keycloak.storeTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
        this.router.navigate(['/welcome']);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid email or password.');
      },
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    const v = this.registerForm.value;
    if (v.password !== v.confirm) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authApi.register(v.name!, v.email!, v.password!).subscribe({
      next: () => {
        // Brief delay so Keycloak finishes indexing the new user before ROPC login
        setTimeout(() => {
          this.authApi.login(v.email!, v.password!).subscribe({
            next: tokens => {
              this.keycloak.storeTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
              this.router.navigate(['/welcome']);
            },
            error: () => {
              this.loading.set(false);
              this.success.set('Account created! Please sign in.');
              this.switchTab('login');
            },
          });
        }, 800);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed.');
      },
    });
  }

  fieldInvalid(form: 'login' | 'register', field: string): boolean {
    const ctrl = form === 'login'
      ? this.loginForm.get(field)
      : this.registerForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
