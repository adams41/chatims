import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';

  
  bootstrapApplication(AppComponent, {
    providers: [appConfig.providers, provideHttpClient(), provideAnimations(), importProvidersFrom([BrowserAnimationsModule])] 
  }).catch(err => console.error(err));