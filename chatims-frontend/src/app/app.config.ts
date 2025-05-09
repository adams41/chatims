import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router'; 
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';
import { routes } from './app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLottieOptions({
      player: () => import('lottie-web')
    }),
    provideCacheableAnimationLoader(),
    provideRouter(routes),
    provideAnimations()
  ]
};
