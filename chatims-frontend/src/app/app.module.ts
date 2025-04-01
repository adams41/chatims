import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

// Factory function for Lottie
export function playerFactory() {  
  return player; // ✅ Correct, returns the player instance
}

@NgModule({
  declarations: [
    AppComponent,
    SplashScreenComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    LottieComponent, 
  ],
  providers: [
    // Provide the factory lottie options.
    provideLottieOptions({
      player: playerFactory,
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}