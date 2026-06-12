import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Gender, Intent, MatchPreferences, RevealedProfile, UserProfile } from '../core/models';
import { AdminApiService } from '../core/services/admin-api.service';
import { ChatRealtimeService } from '../core/services/chat-realtime.service';
import { UserApiService } from '../core/services/user-api.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';
import { KeycloakService } from '../core/services/keycloak.service';

interface PrefOption { label: string; value: string; }
interface PrefQuestion { key: 'ageRange' | 'gender' | 'intent'; label: string; options: PrefOption[]; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly users = inject(UserApiService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);
  private readonly adminApi = inject(AdminApiService);

  private realtimeSub?: Subscription;

  profile = signal<UserProfile | null>(null);
  matches = signal<RevealedProfile[]>([]);
  loading = signal(true);
  isAdmin = signal(false);

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
    {
      key: 'intent',
      label: "I'm looking for",
      options: [
        { label: 'Friendship', value: 'Friendship' },
        { label: 'Dating', value: 'Dating' },
        { label: 'Just chat', value: 'Just chat' },
        { label: 'Networking', value: 'Networking' },
      ],
    },
  ];

  // Distance / location
  maxDistanceKm = signal<number | null>(null);
  locationStatus = signal<'idle' | 'capturing' | 'saved' | 'error'>('idle');
  locationError = signal<string | null>(null);

  // Languages
  readonly LANGUAGE_OPTIONS = [
    'English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 'Dutch',
    'Russian', 'Ukrainian', 'Polish', 'Czech', 'Slovak', 'Hungarian', 'Romanian',
    'Greek', 'Turkish', 'Arabic', 'Hebrew', 'Persian', 'Hindi', 'Bengali',
    'Mandarin', 'Cantonese', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
    'Indonesian', 'Tagalog', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Bulgarian', 'Serbian', 'Croatian', 'Slovenian', 'Lithuanian', 'Latvian', 'Estonian',
  ];
  languages = signal<string[]>([]);
  newLanguage = '';
  languageStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  languageError = signal<string | null>(null);
  availableLanguages = computed(() => {
    const selected = new Set(this.languages().map(l => l.toLowerCase()));
    return this.LANGUAGE_OPTIONS.filter(l => !selected.has(l.toLowerCase()));
  });

  viewerPhotos = signal<string[] | null>(null);
  viewerIndex = signal(0);

  removingMatchId = signal<number | null>(null);
  removeMatchError = signal<string | null>(null);
  matchToRemove = signal<RevealedProfile | null>(null);

  exporting = signal(false);
  exportError = signal<string | null>(null);
  showDeleteConfirm = signal(false);
  deleteConfirmText = signal('');
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.realtime.connect();
    this.realtimeSub = this.realtime.matchRemoved().subscribe(evt => {
      this.matches.update(list => list.filter(m => m.userId !== evt.partnerId));
    });
    this.users.me().pipe(catchError(() => of(null))).subscribe(p => {
      this.profile.set(p);
      if (!p) { this.router.navigate(['/auth']); return; }
      this.maxDistanceKm.set(p.maxDistanceKm ?? null);
      this.languages.set(p.languages ?? []);
      this.applyPhotosFromProfile(p);
      this.prefAnswers.set(this.prefsFromProfile(p));
    });
    this.users.getMatches().pipe(catchError(() => of([] as RevealedProfile[]))).subscribe(m => {
      this.matches.set(m);
      this.loading.set(false);
    });
    this.adminApi.amIAdmin().pipe(catchError(() => of({ admin: false }))).subscribe(r => {
      this.isAdmin.set(!!r.admin);
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
    input.value = '';
    this.photoError.set(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.photoError.set('Photo too large (max 5MB).'); return; }

    const slots = this.photoSlots();
    if (!slots.some(s => s === null)) return;

    this.uploadingPhoto.set(true);
    this.users.addPhoto(file).subscribe({
      next: p => {
        this.profile.set(p);
        this.applyPhotosFromProfile(p);
        this.uploadingPhoto.set(false);
      },
      error: err => {
        this.uploadingPhoto.set(false);
        this.photoError.set(err?.error?.message || 'Upload failed.');
      },
    });
  }

  removePhoto(index: number): void {
    this.photoError.set(null);
    this.users.removePhotoAt(index).subscribe({
      next: p => {
        this.profile.set(p);
        this.applyPhotosFromProfile(p);
      },
      error: err => this.photoError.set(err?.error?.message || 'Failed to remove photo.'),
    });
  }

  matchPhotos(m: RevealedProfile): string[] {
    return (m.photos && m.photos.length > 0) ? m.photos : (m.photoPath ? [m.photoPath] : []);
  }

  extraPhotoCount(m: RevealedProfile): number {
    return Math.max(0, this.matchPhotos(m).length - 1);
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  openRemoveMatch(m: RevealedProfile, ev?: Event): void {
    ev?.stopPropagation();
    this.removeMatchError.set(null);
    this.matchToRemove.set(m);
  }

  cancelRemoveMatch(): void {
    this.matchToRemove.set(null);
    this.removeMatchError.set(null);
  }

  confirmRemoveMatch(): void {
    const m = this.matchToRemove();
    if (!m) return;
    this.removingMatchId.set(m.userId);
    this.removeMatchError.set(null);
    this.users.removeMatch(m.userId).subscribe({
      next: () => {
        this.matches.update(list => list.filter(x => x.userId !== m.userId));
        this.matchToRemove.set(null);
        this.removingMatchId.set(null);
      },
      error: err => {
        this.removingMatchId.set(null);
        this.removeMatchError.set(err?.error?.message || 'Failed to remove match.');
      },
    });
  }

  openMatchPhotos(m: RevealedProfile): void {
    const photos = this.matchPhotos(m);
    if (photos.length === 0) return;
    this.viewerPhotos.set(photos);
    this.viewerIndex.set(0);
  }

  closeViewer(): void {
    this.viewerPhotos.set(null);
  }

  nextViewer(): void {
    const photos = this.viewerPhotos();
    if (!photos || photos.length < 2) return;
    this.viewerIndex.update(i => (i + 1) % photos.length);
  }

  prevViewer(): void {
    const photos = this.viewerPhotos();
    if (!photos || photos.length < 2) return;
    this.viewerIndex.update(i => (i - 1 + photos.length) % photos.length);
  }

  private applyPhotosFromProfile(p: UserProfile): void {
    const urls = (p.photos ?? []).map(path => this.photoUrl(path));
    const slots: (string | null)[] = [null, null, null];
    urls.slice(0, 3).forEach((u, i) => slots[i] = u);
    this.photoSlots.set(slots);
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

  addLanguage(): void {
    const lang = this.newLanguage;
    if (!lang) return;
    const current = this.languages();
    if (current.length >= 10) return;
    if (current.some(l => l.toLowerCase() === lang.toLowerCase())) {
      this.newLanguage = '';
      return;
    }
    this.persistLanguages([...current, lang]);
    this.newLanguage = '';
  }

  removeLanguage(lang: string): void {
    const updated = this.languages().filter(l => l !== lang);
    this.persistLanguages(updated);
  }

  private persistLanguages(list: string[]): void {
    this.languageStatus.set('saving');
    this.languageError.set(null);
    this.users.updateLanguages(list).subscribe({
      next: p => {
        this.profile.set(p);
        this.languages.set(p.languages ?? []);
        this.languageStatus.set('saved');
      },
      error: err => {
        this.languageStatus.set('error');
        this.languageError.set(err?.error?.message || 'Failed to save languages.');
      },
    });
  }

  saveDistance(): void {
    const p = this.profile();
    if (!p) return;
    const dist = this.maxDistanceKm();
    this.locationStatus.set('capturing');
    this.locationError.set(null);
    this.users.updateLocation({
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      maxDistanceKm: dist != null && dist > 0 ? dist : null,
    }).subscribe({
      next: updated => { this.profile.set(updated); this.locationStatus.set('saved'); },
      error: err => {
        this.locationStatus.set('error');
        this.locationError.set(err?.error?.message || 'Failed to save distance.');
      },
    });
  }

  readonly MAX_DISTANCE_KM = 500;

  incrementDistance(step: number): void {
    const current = this.maxDistanceKm() ?? 0;
    const next = Math.max(0, Math.min(this.MAX_DISTANCE_KM, current + step));
    this.maxDistanceKm.set(next === 0 ? null : next);
  }

  onDistanceInput(input: HTMLInputElement): void {
    const trimmed = (input.value ?? '').trim().replace(/^-+/, '');
    if (trimmed === '' || trimmed === '0') {
      this.maxDistanceKm.set(null);
      input.value = '';
      return;
    }
    const n = Math.floor(Math.abs(Number(trimmed)));
    if (!Number.isFinite(n) || n <= 0) {
      this.maxDistanceKm.set(null);
      input.value = '';
      return;
    }
    const clamped = Math.min(this.MAX_DISTANCE_KM, n);
    this.maxDistanceKm.set(clamped);
    if (n > this.MAX_DISTANCE_KM) input.value = String(clamped);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  startChat(): void { this.router.navigate(['/matchmaking']); }
  logout(): void { this.keycloak.logout(); }

  // ── Data privacy (GDPR) ────────────────────────────────────────────────

  exportMyData(): void {
    this.exporting.set(true);
    this.exportError.set(null);
    this.users.exportMyData().subscribe({
      next: response => {
        const blob = response.body;
        if (!blob) {
          this.exporting.set(false);
          this.exportError.set('Empty response.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatims-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: err => {
        this.exporting.set(false);
        this.exportError.set(err?.error?.message || 'Failed to export your data.');
      },
    });
  }

  openDeleteConfirm(): void {
    this.deleteConfirmText.set('');
    this.deleteError.set(null);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteConfirmText.set('');
    this.deleteError.set(null);
  }

  onDeleteConfirmInput(value: string): void {
    this.deleteConfirmText.set(value);
  }

  confirmDelete(): void {
    if (this.deleteConfirmText().trim().toUpperCase() !== 'DELETE') {
      this.deleteError.set('Type DELETE to confirm.');
      return;
    }
    this.deleting.set(true);
    this.deleteError.set(null);
    this.users.deleteAccount().subscribe({
      next: () => {
        const userId = String(this.profile()?.id ?? '');
        if (userId) localStorage.removeItem(`chatims_photos_${userId}`);
        this.keycloak.logout();
      },
      error: err => {
        this.deleting.set(false);
        this.deleteError.set(err?.error?.message || 'Failed to delete your account.');
      },
    });
  }

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
    const intent = this.labelFromIntent(p.intent) ?? '';
    return { ageRange, gender, intent };
  }

  intentLabel(i: Intent | null): string {
    return this.labelFromIntent(i) ?? '';
  }

  get emailVerified(): boolean {
    return this.keycloak.emailVerified;
  }

  accountConsoleUrl(): string {
    const kc = environment.keycloak;
    return `${kc.url}/realms/${kc.realm}/account/`;
  }

  private labelFromIntent(i: Intent | null): string | null {
    switch (i) {
      case 'FRIENDSHIP': return 'Friendship';
      case 'DATING': return 'Dating';
      case 'JUST_CHAT': return 'Just chat';
      case 'NETWORKING': return 'Networking';
      default: return null;
    }
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
    const intent = this.intentFromLabel(a['intent']);
    return { preferredGender, minAge, maxAge, intent };
  }

  private intentFromLabel(label: string | undefined): Intent | null {
    switch (label) {
      case 'Friendship': return 'FRIENDSHIP';
      case 'Dating': return 'DATING';
      case 'Just chat': return 'JUST_CHAT';
      case 'Networking': return 'NETWORKING';
      default: return null;
    }
  }
}
