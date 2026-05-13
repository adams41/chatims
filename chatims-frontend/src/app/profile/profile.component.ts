import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Gender, MatchPreferences, RevealedProfile, UserProfile } from '../core/models';
import { UserApiService } from '../core/services/user-api.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';
import { KeycloakService } from '../core/services/keycloak.service';

interface PrefOption { label: string; value: string; }
interface PrefQuestion { key: 'ageRange' | 'gender'; label: string; options: PrefOption[]; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private readonly users = inject(UserApiService);
  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);

  profile = signal<UserProfile | null>(null);
  matches = signal<RevealedProfile[]>([]);
  loading = signal(true);

  // Photos (up to 3). First slot = main photo from profile.
  photoSlots = signal<(string | null)[]>([null, null, null]);
  uploadingPhoto = signal(false);
  photoError = signal<string | null>(null);

  // Preferences inline editor
  editingPrefs = signal(false);
  savingPrefs = signal(false);
  prefsError = signal<string | null>(null);
  prefAnswers = signal<Record<string, string>>({});

  readonly prefsQuestions: PrefQuestion[] = [
    {
      key: 'ageRange',
      label: 'Age range',
      options: [
        { label: '18–25', value: '18–25' },
        { label: '25–35', value: '25–35' },
        { label: '35–45', value: '35–45' },
        { label: 'Any', value: "Doesn't matter" },
      ],
    },
    {
      key: 'gender',
      label: 'Gender',
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Any', value: "Doesn't matter" },
      ],
    },
  ];

  // Distance / location
  maxDistanceKm = signal<number | null>(null);
  locationStatus = signal<'idle' | 'capturing' | 'saved' | 'error'>('idle');
  locationError = signal<string | null>(null);

  ngOnInit(): void {
    this.users.me().pipe(catchError(() => of(null))).subscribe(p => {
      this.profile.set(p);
      if (!p) { this.router.navigate(['/auth']); return; }
      this.maxDistanceKm.set(p.maxDistanceKm ?? null);
      // Slot 0 = backend photo; slots 1-2 persisted in localStorage
      const url = this.photoUrl(p.photoPath);
      const extras = this.loadExtraPhotos(String(p.id));
      this.photoSlots.set([url, extras[0] ?? null, extras[1] ?? null]);
      this.prefAnswers.set(this.prefsFromProfile(p));
    });
    this.users.getMatches().pipe(catchError(() => of([] as RevealedProfile[]))).subscribe(m => {
      this.matches.set(m);
      this.loading.set(false);
    });
  }

  photoUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  // ── Photos ──────────────────────────────────────────────────────────────

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset input so the same file can be re-selected after removal
    input.value = '';
    this.photoError.set(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.photoError.set('Photo too large (max 5MB).'); return; }

    // Find first empty slot
    const slots = [...this.photoSlots()];
    const emptyIdx = slots.findIndex(s => s === null);
    if (emptyIdx === -1) return;

    this.uploadingPhoto.set(true);
    // Only slot 0 is persisted to the backend (single-photo API).
    // Slots 1-2 are local previews until multi-photo backend support is added.
    if (emptyIdx === 0) {
      this.users.uploadPhoto(file).subscribe({
        next: p => {
          this.profile.set(p);
          const url = this.photoUrl(p.photoPath);
          slots[0] = url;
          this.photoSlots.set([...slots]);
          this.uploadingPhoto.set(false);
        },
        error: err => {
          this.uploadingPhoto.set(false);
          this.photoError.set(err?.error?.message || 'Upload failed.');
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        slots[emptyIdx] = e.target?.result as string;
        this.photoSlots.set([...slots]);
        this.saveExtraPhotos(slots);
        this.uploadingPhoto.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(index: number): void {
    const slots = [...this.photoSlots()];
    slots[index] = null;
    const compacted: (string | null)[] = slots.filter(Boolean) as string[];
    while (compacted.length < 3) compacted.push(null);
    this.photoSlots.set(compacted);
    this.saveExtraPhotos(compacted);
  }

  private loadExtraPhotos(userId: string): (string | null)[] {
    try {
      const raw = localStorage.getItem(`chatims_photos_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveExtraPhotos(slots: (string | null)[]): void {
    const userId = String(this.profile()?.id ?? '');
    if (!userId) return;
    // Only save slots 1 and 2 (slot 0 is the backend photo)
    localStorage.setItem(`chatims_photos_${userId}`, JSON.stringify([slots[1] ?? null, slots[2] ?? null]));
  }

  // ── Preferences ─────────────────────────────────────────────────────────

  setPref(key: string, value: string): void {
    this.prefAnswers.update(a => ({ ...a, [key]: value }));
  }

  savePrefs(): void {
    this.savingPrefs.set(true);
    this.prefsError.set(null);
    const prefs = this.buildPrefs();
    this.users.updatePreferences(prefs).subscribe({
      next: p => {
        this.profile.set(p);
        this.savingPrefs.set(false);
        this.editingPrefs.set(false);
      },
      error: err => {
        this.savingPrefs.set(false);
        this.prefsError.set(err?.error?.message || 'Failed to save.');
      },
    });
  }

  // ── Location ────────────────────────────────────────────────────────────

  captureLocation(): void {
    if (!('geolocation' in navigator)) {
      this.locationStatus.set('error');
      this.locationError.set('Geolocation not supported by this browser.');
      return;
    }
    this.locationStatus.set('capturing');
    this.locationError.set(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const dist = this.maxDistanceKm();
        this.users.updateLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          maxDistanceKm: dist != null && dist > 0 ? dist : null,
        }).subscribe({
          next: p => { this.profile.set(p); this.locationStatus.set('saved'); },
          error: err => {
            this.locationStatus.set('error');
            this.locationError.set(err?.error?.message || 'Failed to save location.');
          },
        });
      },
      err => {
        this.locationStatus.set('error');
        this.locationError.set(err.message || 'Could not read location.');
      },
    );
  }

  setDistance(value: string): void {
    const n = Number(value);
    this.maxDistanceKm.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  startChat(): void { this.router.navigate(['/matchmaking']); }
  logout(): void { this.keycloak.logout(); }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private prefsFromProfile(p: UserProfile): Record<string, string> {
    let ageRange = "Doesn't matter";
    if (p.minAge != null && p.maxAge != null) {
      if (p.minAge === 18 && p.maxAge === 25) ageRange = '18–25';
      else if (p.minAge === 25 && p.maxAge === 35) ageRange = '25–35';
      else if (p.minAge === 35 && p.maxAge === 45) ageRange = '35–45';
    }
    let gender = "Doesn't matter";
    if (p.preferredGender === 'MALE') gender = 'Male';
    else if (p.preferredGender === 'FEMALE') gender = 'Female';
    return { ageRange, gender };
  }

  private buildPrefs(): MatchPreferences {
    const a = this.prefAnswers();
    const ageRange = a['ageRange'] ?? "Doesn't matter";
    const gender = a['gender'] ?? "Doesn't matter";
    let minAge = 18, maxAge = 99;
    if (ageRange === '18–25') { minAge = 18; maxAge = 25; }
    else if (ageRange === '25–35') { minAge = 25; maxAge = 35; }
    else if (ageRange === '35–45') { minAge = 35; maxAge = 45; }
    let preferredGender: Gender | null = null;
    if (gender === 'Male') preferredGender = 'MALE';
    else if (gender === 'Female') preferredGender = 'FEMALE';
    return { preferredGender, minAge, maxAge };
  }
}
