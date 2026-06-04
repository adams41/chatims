import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { KeycloakService } from '../../core/services/keycloak.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css'],
})
export class SplashScreenComponent implements OnInit {
  @ViewChild('lottie', { static: true }) lottieContainer!: ElementRef;

  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);
  private readonly themeSvc = inject(ThemeService);

  loading = true;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  get theme(): 'dark' | 'light' {
    return this.themeSvc.theme();
  }

  ngOnInit(): void {
    this.loading = false;
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.loadLottie(), 0);
    }
  }

  goToChat(): void {
    if (this.keycloak.isTokenValid) {
      this.router.navigate(['/welcome']);
    } else {
      this.router.navigate(['/auth']);
    }
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
  }

  private loadLottie(): void {
    if (!this.lottieContainer?.nativeElement) return;
    import('lottie-web').then((lottie: any) => {
      (lottie.default ?? lottie).loadAnimation({
        container: this.lottieContainer.nativeElement,
        path: '/assets/animation/animation.json',
        renderer: 'svg',
        loop: true,
        autoplay: true,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
    });
  }
}
