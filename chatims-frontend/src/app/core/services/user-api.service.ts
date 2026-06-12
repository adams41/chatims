import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MatchPreferences,
  RevealedProfile,
  UpdateContactsRequest,
  UpdateLocationRequest,
  UserProfile,
} from '../models';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly theme = inject(ThemeService);
  private readonly base = environment.apiUrl;

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/users/me`).pipe(
      tap(p => this.theme.applyRemote(p.theme))
    );
  }

  getByKeycloakId(keycloakId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/users/keycloak/${keycloakId}`);
  }

  completeProfile(form: FormData): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.base}/users/complete-profile`, form);
  }

  updateContacts(req: UpdateContactsRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/users/me/contacts`, req);
  }

  updatePreferences(prefs: MatchPreferences): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/users/me/preferences`, prefs);
  }

  getMatches(): Observable<RevealedProfile[]> {
    return this.http.get<RevealedProfile[]>(`${this.base}/users/me/matches`);
  }

  updateLocation(req: UpdateLocationRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/users/me/location`, req);
  }

  updateLanguages(languages: string[]): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/users/me/languages`, { languages });
  }

  uploadPhoto(file: File): Observable<UserProfile> {
    const fd = new FormData();
    fd.append('photo', file, file.name);
    return this.http.post<UserProfile>(`${this.base}/users/me/photo`, fd);
  }

  addPhoto(file: File): Observable<UserProfile> {
    const fd = new FormData();
    fd.append('photo', file, file.name);
    return this.http.post<UserProfile>(`${this.base}/users/me/photos`, fd);
  }

  removePhotoAt(position: number): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.base}/users/me/photos/${position}`);
  }

  exportMyData(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/users/me/export`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me`);
  }

  removeMatch(partnerId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/matches/${partnerId}`);
  }

  updateTheme(theme: 'dark' | 'light'): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/users/me/theme`, { theme });
  }

  reportUser(reportedId: number, reason: string, chatId: number | null, details: string | null): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base}/users/me/reports`, {
      reportedId, reason, chatId, details,
    });
  }
}
