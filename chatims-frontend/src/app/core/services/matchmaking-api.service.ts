import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, MatchPreferences } from '../models';
import { KeycloakService } from './keycloak.service';

export type MatchEvent =
  | { type: 'matched'; session: ChatSession }
  | { type: 'no_match' }
  | { type: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class MatchmakingApiService {
  private readonly http = inject(HttpClient);
  private readonly keycloak = inject(KeycloakService);
  private readonly zone = inject(NgZone);
  private readonly base = environment.apiUrl;

  join(prefs: MatchPreferences): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base}/matchmaking/join`, prefs);
  }

  /**
   * Opens an SSE stream to /matchmaking/stream.
   * Emits one MatchEvent then the Observable completes.
   * The caller must unsubscribe to cancel (will call leaveQueue).
   */
  stream(signal: AbortSignal): Observable<MatchEvent> {
    return new Observable(observer => {
      const token = this.keycloak.getToken();
      fetch(`${this.base}/matchmaking/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      }).then(async res => {
        if (!res.ok || !res.body) {
          this.zone.run(() => observer.error(new Error(`Stream failed: ${res.status}`)));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() ?? '';
          for (const part of parts) {
            const event = parseSseBlock(part);
            if (event) {
              this.zone.run(() => { observer.next(event); observer.complete(); });
              return;
            }
          }
        }
        this.zone.run(() => observer.complete());
      }).catch(err => {
        this.zone.run(() => {
          if (err.name !== 'AbortError') observer.error(err);
          else observer.complete();
        });
      });
    });
  }

  leaveQueue(): Observable<void> {
    return this.http.delete<void>(`${this.base}/matchmaking/queue`);
  }
}

function parseSseBlock(block: string): MatchEvent | null {
  let eventName = '';
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    else if (line.startsWith('data:')) data = line.slice(5).trim();
  }
  if (eventName === 'matched') {
    try { return { type: 'matched', session: JSON.parse(data) }; } catch { return null; }
  }
  if (eventName === 'no_match') return { type: 'no_match' };
  if (eventName === 'error') return { type: 'error', message: data };
  return null;
}
