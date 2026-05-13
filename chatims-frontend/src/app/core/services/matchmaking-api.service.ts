import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, MatchPreferences } from '../models';

@Injectable({ providedIn: 'root' })
export class MatchmakingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  find(prefs: MatchPreferences): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.base}/matchmaking/find`, prefs);
  }

  leaveQueue(): Observable<void> {
    return this.http.delete<void>(`${this.base}/matchmaking/queue`);
  }
}
