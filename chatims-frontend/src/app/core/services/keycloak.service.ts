import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const STORAGE_KEY = 'chatims_auth';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  constructor(private router: Router) {}


  storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const data: StoredTokens = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000 - 30_000, // 30s buffer
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  getToken(): string | null {
    const data = this.loadStored();
    return data?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    const data = this.loadStored();
    return data?.refreshToken ?? null;
  }

  get isTokenValid(): boolean {
    const data = this.loadStored();
    if (!data) return false;
    return Date.now() < data.expiresAt;
  }

  get userId(): string {
    const token = this.getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['sub'] ?? '';
    } catch {
      return '';
    }
  }

  get fullName(): string {
    return this.parseClaim<string>('name') ?? '';
  }

  get email(): string | null {
    return this.parseClaim<string>('email') ?? null;
  }

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/']);
  }


  private loadStored(): StoredTokens | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredTokens) : null;
    } catch {
      return null;
    }
  }

  private parseClaim<T>(claim: string): T | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload[claim] as T) ?? null;
    } catch {
      return null;
    }
  }
}
