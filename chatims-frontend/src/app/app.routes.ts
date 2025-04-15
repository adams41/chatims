import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { RegisterComponent } from './user/register/register.component';

export const routes: Routes = [{
    path: 'chat',
    component: ChatComponent,
    
  }, 
 {path: 'register', component: RegisterComponent }, ];
