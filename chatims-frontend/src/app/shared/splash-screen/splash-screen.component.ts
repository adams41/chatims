import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router'; 
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { KeycloakService } from '../../utils/keycloak/keycloak.service';

@Component({
  selector: 'app-splash-screen',
  imports: [MatButtonModule,
    MatIconModule, CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
  
})
export class SplashScreenComponent implements OnInit {
  @ViewChild('lottie', { static: true }) lottieContainer!: ElementRef;

  constructor(private router: Router,
    private keycloakService: KeycloakService,  @Inject(PLATFORM_ID) private platformId: Object) {}

   ngOnInit() { 
    if (isPlatformBrowser(this.platformId)) {
      import('lottie-web').then((lottie) => {
        const animation = (lottie as any).loadAnimation({
          container: this.lottieContainer.nativeElement,
          path: '/assets/animation/animation.json',
          renderer: 'svg',
          loop: true,
          autoplay: true
        });
      });
    }}

 async goToRegister() {
  await this.keycloakService.init();
  await this.keycloakService.login();
  }

   }
