import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { keycloakHttpInterceptor } from './core/interceptors/keycloak-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([keycloakHttpInterceptor])),
    provideLottieOptions({ player: () => import('lottie-web') }),
    provideCacheableAnimationLoader(),
  ],
};
