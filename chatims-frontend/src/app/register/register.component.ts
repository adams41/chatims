import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { KeycloakService } from '../core/services/keycloak.service';
import { UserApiService } from '../core/services/user-api.service';
import { Intent, UserProfile } from '../core/models';
import { environment } from '../../environments/environment';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly users = inject(UserApiService);
  private readonly keycloak = inject(KeycloakService);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  step: 'profile' | 'contacts' | 'preferences' = 'profile';
  isLoading = false;
  errorMessage: string | null = null;
  existingProfile: UserProfile | null = null;

  // Profile step
  profileForm = this.fb.group({
    age: [null as number | null, [Validators.required, Validators.min(18), Validators.max(120)]],
    gender: ['', Validators.required],
  });
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  photoError: string | null = null;

  // Contacts step
  contactsForm = this.fb.group(
    {
      whatsappNumber: [''],
      telegramHandle: [''],
      viberNumber: [''],
    },
    { validators: this.atLeastOneContactValidator }
  );

  // Preferences step — 'ANY' is a UI-only sentinel mapped to null when sent to the backend.
  preferencesForm = this.fb.group({
    preferredGender: ['ANY', Validators.required],
    minAge: [18, [Validators.required, Validators.min(18), Validators.max(120)]],
    maxAge: [60, [Validators.required, Validators.min(18), Validators.max(120)]],
    intent: ['' as Intent | '', Validators.required],
  });

  readonly intentOptions: { value: Intent; label: string }[] = [
    { value: 'FRIENDSHIP', label: 'Friendship' },
    { value: 'DATING', label: 'Dating' },
    { value: 'JUST_CHAT', label: 'Just chat' },
    { value: 'NETWORKING', label: 'Networking' },
  ];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  get userName(): string {
    return this.keycloak.fullName || '';
  }

  ngOnInit(): void {
    this.users
      .me()
      .pipe(catchError(() => of(null)))
      .subscribe(profile => {
        if (profile) {
          this.existingProfile = profile;
          // Pre-fill existing photo preview
          if (profile.photoPath) {
            const url = this.photoUrl(profile.photoPath);
            if (url) this.previewUrl = url;
          }
          this.contactsForm.patchValue({
            whatsappNumber: profile.whatsappNumber ?? '',
            telegramHandle: profile.telegramHandle ?? '',
            viberNumber: profile.viberNumber ?? '',
          });
          this.preferencesForm.patchValue({
            preferredGender: profile.preferredGender ?? 'ANY',
            minAge: profile.minAge ?? 18,
            maxAge: profile.maxAge ?? 60,
          });
          // Auto-advance based on what's already filled:
          // - has contacts + prefs set → user is just editing photo, stay on profile step
          // - has contacts but no prefs → start them on the prefs step
          // - has only profile → go to contacts
          if (profile.hasContact && profile.minAge != null && profile.maxAge != null) {
            this.step = 'contacts';
          } else if (profile.hasContact) {
            this.step = 'preferences';
          }
        }
      });
  }

  goBackToContacts(): void {
    this.step = 'contacts';
  }

  goBackToProfile(): void {
    this.step = 'profile';
  }

  private atLeastOneContactValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value as { whatsappNumber: string; telegramHandle: string; viberNumber: string };
    const any = (v.whatsappNumber || '').trim() || (v.telegramHandle || '').trim() || (v.viberNumber || '').trim();
    return any ? null : { atLeastOneContact: true };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.photoError = null;
    if (!file) return;

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.photoError = 'Use JPG, PNG, or WebP.';
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.photoError = `Image too large (${(file.size / 1024 / 1024).toFixed(2)}MB, max 5MB).`;
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => this.zone.run(() => {
      this.previewUrl = e.target?.result as string;
      this.cdr.markForCheck();
    });
    reader.readAsDataURL(file);
  }

  submitProfile(): void {
    this.errorMessage = null;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    // If profile already exists, only upload new photo if user selected one
    if (this.existingProfile) {
      if (this.selectedFile) {
        this.isLoading = true;
        this.users.uploadPhoto(this.selectedFile).subscribe({
          next: profile => this.zone.run(() => {
            this.existingProfile = profile;
            this.isLoading = false;
            this.step = 'contacts';
            this.cdr.markForCheck();
          }),
          error: err => this.zone.run(() => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Failed to upload photo.';
            this.cdr.markForCheck();
          }),
        });
      } else {
        // No new photo — just advance
        this.step = 'contacts';
      }
      return;
    }
    if (!this.selectedFile) {
      this.photoError = 'Photo is required.';
      return;
    }
    const v = this.profileForm.value;
    const form = new FormData();
    form.append('name', this.userName || 'User');
    form.append('age', String(v.age));
    form.append('gender', v.gender || '');
    form.append('photo', this.selectedFile, this.selectedFile.name);

    this.isLoading = true;
    this.users.completeProfile(form).subscribe({
      next: profile => this.zone.run(() => {
        this.existingProfile = profile;
        this.isLoading = false;
        this.step = 'contacts';
        this.cdr.markForCheck();
      }),
      error: err => this.zone.run(() => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to save profile.';
        this.cdr.markForCheck();
      }),
    });
  }

  submitContacts(): void {
    this.errorMessage = null;
    if (this.contactsForm.invalid) {
      this.contactsForm.markAllAsTouched();
      return;
    }
    const v = this.contactsForm.value;
    this.isLoading = true;
    this.users
      .updateContacts({
        whatsappNumber: nullable(v.whatsappNumber),
        telegramHandle: nullable(v.telegramHandle),
        viberNumber: nullable(v.viberNumber),
      })
      .subscribe({
        next: () => this.zone.run(() => {
          this.isLoading = false;
          this.step = 'preferences';
          this.cdr.markForCheck();
        }),
        error: err => this.zone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to save contacts.';
          this.cdr.markForCheck();
        }),
      });
  }

  submitPreferences(): void {
    this.errorMessage = null;
    const v = this.preferencesForm.value;
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }
    if ((v.minAge ?? 0) > (v.maxAge ?? 0)) {
      this.errorMessage = 'Min age must be less than or equal to max age.';
      return;
    }
    this.isLoading = true;
    this.users
      .updatePreferences({
        preferredGender: v.preferredGender === 'ANY' ? null : (v.preferredGender as 'MALE' | 'FEMALE'),
        minAge: v.minAge!,
        maxAge: v.maxAge!,
        intent: (v.intent || null) as Intent | null,
      })
      .subscribe({
        next: () => this.zone.run(() => {
          this.isLoading = false;
          this.router.navigate(['/profile']);
          this.cdr.markForCheck();
        }),
        error: err => this.zone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to save preferences.';
          this.cdr.markForCheck();
        }),
      });
  }

  photoUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }
}

function nullable(v: string | null | undefined): string | null {
  const t = (v || '').trim();
  return t.length ? t : null;
}
