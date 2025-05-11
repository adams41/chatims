import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router'; 
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';
import { routes } from './app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { KeycloakService } from './utils/keycloak/keycloak.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { keycloakHttpInterceptor } from './utils/http/keycloak-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLottieOptions({
      player: () => import('lottie-web')
    }),
    provideCacheableAnimationLoader(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([keycloakHttpInterceptor])),
    provideAppInitializer(()  => {
      const initFn = ((key: KeycloakService) =>  {
        return () => key.init()
      })(inject(KeycloakService));
      return initFn();

    })
  ]
};
