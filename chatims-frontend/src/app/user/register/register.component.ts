import { Component, EventEmitter, Output  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar/progress-bar.component';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule,  
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ProgressBarComponent,
    CommonModule],
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  @Output() back = new EventEmitter<void>();

  goBack() {
    this.back.emit();
  }
  registerForm: FormGroup;

  isLoading = false;
  isRegistered = false;

  
  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      age: ['', [Validators.required, Validators.min(18)]],
      gender: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const formData = this.registerForm.value;
      this.http.post('/users/register', formData).subscribe(
        
        response => {
          console.log('Registration successful', response);
          this.isLoading = false;
          this.isRegistered = true;
          setTimeout(() => {
            this.isRegistered = false;
          }, 10000);
        },
        error => {
          console.error('Registration failed', error);
          this.isLoading = false;
        }
        
      );
    }
  }
 
}
