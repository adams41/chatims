import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  login(username: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/login`,
      { username, password },
      { withCredentials: true },
    );
  }

  register(name: string, email: string, password: string, inviteCode: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/auth/register`,
      { name, email, password, inviteCode },
    );
  }

  refresh(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/refresh`,
      {},
      { withCredentials: true },
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/auth/logout`,
      {},
      { withCredentials: true },
    );
  }
}
