import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  registerForm: FormGroup;
  
  constructor(private fb: FormBuilder, private http: HttpClient) {
      this.registerForm = this.fb.group({
        username: ['', Validators.required],
        gender: ['', Validators.required],
        age: ['', [Validators.required, Validators.min(18)]]
      });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      this.http.post('/users/register', formData).subscribe(
        response => {
          console.log('Registration successful', response);
        },
        error => {
          console.error('Registration failed', error);
        }
      );
    }
  }
}
