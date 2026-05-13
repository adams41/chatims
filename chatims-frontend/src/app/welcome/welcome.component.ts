import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { UserApiService } from '../core/services/user-api.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="center-screen">
      <div class="spinner"></div>
    </section>
  `,
})
export class WelcomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly users = inject(UserApiService);

  ngOnInit(): void {
    this.users
      .me()
      .pipe(catchError(() => of(null)))
      .subscribe(profile => {
        if (!profile) {
          this.router.navigate(['/register']);
          return;
        }
        if (!profile.hasContact) {
          this.router.navigate(['/register']);
          return;
        }
        // First-time users (no preferences yet) go set them. After that, land on profile/home.
        if (profile.minAge == null || profile.maxAge == null) {
          this.router.navigate(['/preferences']);
          return;
        }
        this.router.navigate(['/profile']);
      });
  }
}
