import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/splash-screen/splash-screen.component').then(m => m.SplashScreenComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'register',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'welcome',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./welcome/welcome.component').then(m => m.WelcomeComponent),
  },
  {
    path: 'preferences',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./chat/chat-preferences/chat-preferences.component').then(m => m.ChatPreferencesComponent),
  },
  {
    path: 'matchmaking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./matchmaking/matchmaking.component').then(m => m.MatchmakingComponent),
  },
  {
    path: 'chat/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./chat/chat.component').then(m => m.ChatComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'impressum',
    loadComponent: () =>
      import('./legal/impressum.component').then(m => m.ImpressumComponent),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
  },
  { path: '**', redirectTo: '' },
];
