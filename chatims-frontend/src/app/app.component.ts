import { Component} from '@angular/core'; 
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import {MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common'; 
import { ChatComponent } from './chat/chat.component';


@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html',
  standalone: true,
  imports:[SplashScreenComponent,  MatButtonModule,
    MatIconModule, CommonModule, ChatComponent],
  styleUrl: './app.component.css'
})
export class AppComponent  {
  showChat = false;

  goToChat() {
    this.showChat = true;
  }

  isDarkMode = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }
}

