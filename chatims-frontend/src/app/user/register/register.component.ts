import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar/progress-bar.component';
import { KeycloakService } from '../../utils/keycloak/keycloak.service';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user/user.service';

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
    CommonModule,
    ProgressBarComponent,
  ],
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  @Output() back = new EventEmitter<void>();

  registerForm: FormGroup;
  isLoading = false;
  isRegistered = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  isKeycloakUser = false;
  keycloakId: string | null = null;
  userName: string | null = null;

  private apiUrl = environment.apiUrl || 'http://localhost:8081';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private userService: UserService,
    private keycloakService: KeycloakService
  ) {
    this.registerForm = this.fb.group({
      age: ['', [Validators.required, Validators.min(18)]],
      gender: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.keycloakService.init();
      this.handleKeycloakUser();
    } catch (error) {
      console.error('[RegisterComponent] Keycloak init failed', error);
    }
  }

  private handleKeycloakUser(): void {
    if (this.keycloakService.isTokenValid) {
      this.isKeycloakUser = true;
      this.keycloakId = this.keycloakService.userId;
      this.userName = this.keycloakService.fullName;
      this.fetchExistingUser();
    } else {
      this.redirectToKeycloakAuth();
    }
  }

  private fetchExistingUser(): void {
    if (!this.keycloakId) return;

    this.isLoading = true;
    const headers = this.createAuthHeaders();

    this.http
      .get(`${this.apiUrl}/users/keycloak/${this.keycloakId}`, { headers })
      .subscribe({
        next: (user: any) => {
          this.userService.setUserName(user.name);
          this.userService.setUserAge(user.age);
          this.userService.setUserPhoto(user.photoPath);
          this.isLoading = false;
          this.router.navigate(['/welcome']);
        },
        error: (error) => {
          console.log(
            'User not found in database, needs to complete profile',
            error
          );
          this.isLoading = false;
        },
      });
  }

  private createAuthHeaders(): HttpHeaders {
    const token = this.keycloakService.getToken();
    if (!token) {
      console.error('Token is missing!');
      this.redirectToKeycloakAuth();
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private redirectToKeycloakAuth(): void {
    this.keycloakService.login();
  }

  onSubmit(): void {
    if (!this.registerForm.valid) return;

    this.isLoading = true;

    const formData = new FormData();
    formData.append('age', this.registerForm.get('age')?.value);
    formData.append('gender', this.registerForm.get('gender')?.value);
    formData.append('keycloakId', this.keycloakId || '');
    formData.append('name', this.userName || '');

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile, this.selectedFile.name);
    }

    const headers = this.createAuthHeaders();

    this.http
      .post(`${this.apiUrl}/users/complete-profile`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Profile completion successful', response);
          this.userService.setUserName(response.name);
          this.userService.setUserAge(response.age);
          this.userService.setUserPhoto(response.photoPath);

          this.isLoading = false;
          this.isRegistered = true;

          setTimeout(() => {
            this.isRegistered = false;
            this.router.navigate(['/welcome']);
          }, 2000);
        },
        error: (error) => {
          console.error('Profile completion failed', error);
          this.isLoading = false;
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  goBack(): void {
    this.router.navigate(['']);
  }
}
