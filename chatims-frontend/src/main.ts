import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

  
  bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideAnimations()] // ✅ Ensure animations are provided
  }).catch(err => console.error(err));