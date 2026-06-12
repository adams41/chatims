import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'chatims_pwa_install_dismissed_at';
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="pwa-install-banner">
        <span>Install Chatims as an app for faster access.</span>
        <div class="pwa-install-actions">
          <button class="btn-link" (click)="install()">Install</button>
          <button class="btn-link" (click)="dismiss()">Later</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pwa-install-banner {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 20, 30, 0.95);
      color: #fff;
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 90vw;
    }
    .pwa-install-actions { display: flex; gap: 8px; }
    .btn-link {
      background: none;
      border: none;
      color: #6ea8ff;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 4px 6px;
    }
    .btn-link:hover { text-decoration: underline; }
  `],
})
export class PwaInstallComponent implements OnInit {
  visible = signal(false);
  private deferred: BeforeInstallPromptEvent | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < REMIND_AFTER_MS) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.visible.set(true);
    });
  }

  async install(): Promise<void> {
    if (!this.deferred) return;
    await this.deferred.prompt();
    await this.deferred.userChoice;
    this.deferred = null;
    this.visible.set(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  dismiss(): void {
    this.visible.set(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }
}
