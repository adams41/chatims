import { Component, EventEmitter, Output } from '@angular/core';
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
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ProgressBarComponent,
    CommonModule
  ],
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
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
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

      const formData = new FormData();
      formData.append('name', this.registerForm.get('name')?.value);
      formData.append('email', this.registerForm.get('email')?.value);
      formData.append('age', this.registerForm.get('age')?.value);
      formData.append('gender', this.registerForm.get('gender')?.value);
      formData.append('password', this.registerForm.get('password')?.value);

      if (this.selectedFile) {
        formData.append('photo', this.selectedFile, this.selectedFile.name);
      }

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}
