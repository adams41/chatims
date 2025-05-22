import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser'; 
import { NgModule } from '@angular/core';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import { LottieComponent,provideLottieOptions  } from 'ngx-lottie';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms'; 
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


export function playerFactory() {
  return import('lottie-web').then(m => m.default);
}

@NgModule({
  declarations: [
    AppComponent,
    SplashScreenComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    MatIconModule,
    ReactiveFormsModule,
    BrowserAnimationsModule
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