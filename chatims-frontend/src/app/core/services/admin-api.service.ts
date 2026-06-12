import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InviteCode {
  code: string;
  note: string | null;
  createdAt: string;
  usedAt: string | null;
  usedByUserId: number | null;
  expiresAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  amIAdmin(): Observable<{ admin: boolean }> {
    return this.http.get<{ admin: boolean }>(`${this.base}/users/me/admin-status`);
  }

  listInvites(): Observable<InviteCode[]> {
    return this.http.get<InviteCode[]>(`${this.base}/admin/invites`);
  }

  generateInvites(count: number, note: string | null, expiresInDays: number | null): Observable<{ codes: string[] }> {
    return this.http.post<{ codes: string[] }>(`${this.base}/admin/invites`, { count, note, expiresInDays });
  }

  revokeInvite(code: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/invites/${encodeURIComponent(code)}`);
  }
}
