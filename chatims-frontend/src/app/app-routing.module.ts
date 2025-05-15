  import { NgModule } from '@angular/core';
  import { RouterModule, Routes } from '@angular/router';
  import { ChatComponent } from './chat/chat.component';
  import { WelcomeComponent } from './user/welcome/welcome.component';
  import { RegisterComponent } from './user/register/register.component';
  import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
  import { ChatPreferencesComponent } from './chat/chat-preferences/chat-preferences.component';

  export const routes: Routes = [
    { path: '', component: SplashScreenComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'welcome', component: WelcomeComponent },
    { path: 'chat', component: ChatComponent },
    { path: 'chat-preferences', component: ChatPreferencesComponent }
  ];

  @NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule {}
