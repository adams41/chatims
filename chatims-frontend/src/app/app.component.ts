import { Component } from '@angular/core';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [ChatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'chatims-frontend';
}
