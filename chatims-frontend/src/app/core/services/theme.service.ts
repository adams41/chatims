import { Injectable, Inject, Injector, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';
const STORAGE_KEY = 'chatims-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('dark');
  private readonly isBrowser: boolean;
  private remoteSyncEnabled = false;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly injector: Injector,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark';
      this.set(saved, { persistRemote: false });
    }
  }

  applyRemote(theme: Theme | null | undefined): void {
    this.remoteSyncEnabled = true;
    if (theme === 'dark' || theme === 'light') {
      this.set(theme, { persistRemote: false });
    }
  }

  disableRemoteSync(): void {
    this.remoteSyncEnabled = false;
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(t: Theme, opts: { persistRemote?: boolean } = { persistRemote: true }): void {
    this.theme.set(t);
    if (!this.isBrowser) return;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEY, t);
    if (opts.persistRemote !== false && this.remoteSyncEnabled) {
      import('./user-api.service').then(({ UserApiService }) => {
        const api = this.injector.get(UserApiService);
        api.updateTheme(t).subscribe({ error: () => { /* local already applied */ } });
      });
    }
  }
}
