import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MatchPreferences,
  RevealedProfile,
  UpdateContactsRequest,
  UpdateLocationRequest,
  UserProfile,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/users/me`);
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

  uploadPhoto(file: File): Observable<UserProfile> {
    const fd = new FormData();
    fd.append('photo', file, file.name);
    return this.http.post<UserProfile>(`${this.base}/users/me/photo`, fd);
  }
}
