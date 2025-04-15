import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';  
import { ChatComponent } from './chat/chat.component';  
import { RegisterComponent } from './user/register/register.component';

const routes: Routes = [
  { path: '', component: SplashScreenComponent },  
  { path: 'chat', component: ChatComponent },   
  { path: 'register', component: RegisterComponent },      
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],  
  exports: [RouterModule]              
})
export class AppRoutingModule {}
