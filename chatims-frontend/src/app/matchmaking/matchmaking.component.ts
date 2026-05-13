import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, catchError, of, timeout } from 'rxjs';
import { MatchmakingApiService } from '../core/services/matchmaking-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.css'],
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  private readonly matchmaking = inject(MatchmakingApiService);
  private readonly users = inject(UserApiService);
  private readonly router = inject(Router);

  status: 'searching' | 'failed' = 'searching';
  errorMessage: string | null = null;
  private sub?: Subscription;

  ngOnInit(): void {
    this.doSearch();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  retry(): void {
    this.status = 'searching';
    this.errorMessage = null;
    this.doSearch();
  }

  back(): void {
    this.router.navigate(['/preferences']);
  }

  private doSearch(): void {
    this.sub?.unsubscribe();
    this.sub = this.users
      .me()
      .pipe(catchError(() => of(null)))
      .subscribe(profile => {
        if (!profile) {
          this.fail('Could not load your profile. Please log in again.');
          this.router.navigate(['/welcome']);
          return;
        }
        if (!profile.hasContact) {
          this.fail('Add at least one contact method first.');
          this.router.navigate(['/register']);
          return;
        }
        if (profile.minAge == null || profile.maxAge == null) {
          this.fail('Set your preferences first.');
          this.router.navigate(['/preferences']);
          return;
        }

        this.sub = this.matchmaking
          .find({
            preferredGender: profile.preferredGender,
            minAge: profile.minAge,
            maxAge: profile.maxAge,
          })
          .pipe(
            timeout(12000),
            catchError(err => {
              const msg =
                err?.name === 'TimeoutError'
                  ? 'Search timed out. Try again.'
                  : err?.error?.message || err?.message || 'No partner available right now.';
              this.fail(msg);
              return of(null);
            })
          )
          .subscribe(session => {
            if (session) {
              this.router.navigate(['/chat', session.chatId]);
            }
          });
      });
  }

  private fail(msg: string): void {
    this.status = 'failed';
    this.errorMessage = msg;
  }
}
