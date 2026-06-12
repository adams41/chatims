import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, catchError, of, switchMap } from 'rxjs';
import { ChatRealtimeService } from '../core/services/chat-realtime.service';
import { MatchmakingApiService } from '../core/services/matchmaking-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

type Status = 'joining' | 'searching' | 'no_match' | 'failed';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  private readonly matchmaking = inject(MatchmakingApiService);
  private readonly users = inject(UserApiService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  status: Status = 'joining';
  errorMessage: string | null = null;

  private sub?: Subscription;
  private abortController?: AbortController;

  ngOnInit(): void {
    this.realtime.connect();
    this.doSearch();
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  retry(): void {
    this.cancel();
    this.status = 'joining';
    this.errorMessage = null;
    this.cdr.markForCheck();
    this.doSearch();
  }

  back(): void {
    this.cancel();
    this.router.navigate(['/profile']);
  }

  private setStatus(s: Status, msg: string | null = null): void {
    this.zone.run(() => {
      this.status = s;
      this.errorMessage = msg;
      this.cdr.markForCheck();
    });
  }

  private doSearch(): void {
    this.sub = this.users.me().pipe(
      catchError(() => of(null)),
      switchMap(profile => {
        if (!profile) { this.router.navigate(['/welcome']); return of(null); }
        if (!profile.hasContact) { this.router.navigate(['/register']); return of(null); }
        if (profile.minAge == null || profile.maxAge == null) { this.router.navigate(['/profile']); return of(null); }

        const prefs = {
          preferredGender: profile.preferredGender,
          minAge: profile.minAge,
          maxAge: profile.maxAge,
          intent: profile.intent,
        };

        return this.matchmaking.join(prefs).pipe(
          catchError(err => {
            this.setStatus('failed', err?.error?.message || 'Could not join queue.');
            return of(null);
          })
        );
      }),
      switchMap(joined => {
        if (joined === null) return of(null);
        this.setStatus('searching');
        this.abortController = new AbortController();
        return this.matchmaking.stream(this.abortController.signal).pipe(
          catchError(err => {
            this.setStatus('failed', err?.message || 'Connection lost. Try again.');
            return of(null);
          })
        );
      })
    ).subscribe(event => {
      if (!event) return;
      if (event.type === 'matched') {
        this.zone.run(() => this.router.navigate(['/chat', event.session.chatId]));
      } else if (event.type === 'no_match') {
        this.setStatus('no_match');
      } else if (event.type === 'error') {
        this.setStatus('failed', event.message || 'Something went wrong.');
      }
    });
  }

  private cancel(): void {
    this.sub?.unsubscribe();
    this.abortController?.abort();
    this.matchmaking.leaveQueue().subscribe({ error: () => {} });
  }
}
