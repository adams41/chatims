import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router'; 
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';
import { routes } from './app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {keycloakHttpInterceptor} from './utils/http/keycloak-http.interceptor';
import {KeycloakService} from './utils/keycloak/keycloak.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLottieOptions({
      player: () => import('lottie-web')
    }),
    {
      provide:  provideAppInitializer,
      multi: true,
      useFactory: () => () => inject(KeycloakService).init()
    },
    provideCacheableAnimationLoader(),
    provideRouter(routes),
    provideAnimations(), 
    provideHttpClient(   
      withInterceptors([keycloakHttpInterceptor])
  ),
 
  ]
};
