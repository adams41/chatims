import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import lottie from 'lottie-web';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html',
  imports:[SplashScreenComponent, ChatComponent],
  styleUrl: './app.component.css'
})
export class AppComponent  {
 
}