import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import player from 'lottie-web';
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLottieOptions({ player: () => player }),
    provideCacheableAnimationLoader(),
    provideRouter(routes)
  ]
};
