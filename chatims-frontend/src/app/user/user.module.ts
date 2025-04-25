import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { WelcomeComponent } from './welcome/welcome.component';
import { RegisterComponent } from './register/register.component';



@NgModule({
  declarations: [
    RegisterComponent,
    WelcomeComponent
  ],
  imports: [
    CommonModule, ReactiveFormsModule
  ],
  exports: [WelcomeComponent] 
})
export class UserModule { }
