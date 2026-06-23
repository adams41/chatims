import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      class="theme-toggle"
      type="button"
      (click)="theme.toggle()"
      [title]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      {{ theme.theme() === 'dark' ? '☀️' : '🌙' }}
    </button>
  `,
  styles: [`
    .theme-toggle {
      position: fixed;
      top: max(14px, env(safe-area-inset-top));
      right: max(14px, env(safe-area-inset-right));
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      color: var(--color-text);
      font-size: 1.1rem;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, border-color 0.2s;
      box-shadow: var(--shadow-soft);
    }
    .theme-toggle:hover { transform: scale(1.08); border-color: var(--color-primary); }
  `],
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
