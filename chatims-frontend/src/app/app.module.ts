import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser'; 
import { NgModule } from '@angular/core';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import { LottieComponent,provideLottieOptions  } from 'ngx-lottie';
import player from 'lottie-web';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { MatIconModule } from '@angular/material/icon';


export function playerFactory() {  
  return player; 
}

@NgModule({
  declarations: [
    AppComponent,
    SplashScreenComponent
  ],
  imports: [
    BrowserModule,
    LottieComponent,
    FormsModule,
    AppRoutingModule,
    MatIconModule
  ],
  providers: [ 
    {
      provide: provideLottieOptions,
      useFactory: playerFactory   
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}