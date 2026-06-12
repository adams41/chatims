import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService, InviteCode } from '../core/services/admin-api.service';

@Component({
  selector: 'app-admin-invites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './admin-invites.component.html',
  styleUrl: './admin-invites.component.css',
})
export class AdminInvitesComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  invites = signal<InviteCode[]>([]);

  count = 1;
  note = '';
  expiresInDays: number | null = 7;
  generating = signal(false);
  justGenerated = signal<{ code: string; expiresAt: string | null }[]>([]);
  copyHint = signal<string | null>(null);

  filter: 'all' | 'unused' | 'used' = 'all';

  ngOnInit(): void {
    this.api.amIAdmin().subscribe({
      next: r => {
        if (!r.admin) {
          this.router.navigate(['/']);
          return;
        }
        this.refresh();
      },
      error: () => this.router.navigate(['/']),
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listInvites().subscribe({
      next: list => { this.invites.set(list); this.loading.set(false); },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to load invites.');
      },
    });
  }

  filtered(): InviteCode[] {
    const list = this.invites();
    if (this.filter === 'used') return list.filter(i => !!i.usedAt);
    if (this.filter === 'unused') return list.filter(i => !i.usedAt);
    return list;
  }

  unusedCount(): number {
    return this.invites().filter(i => !i.usedAt).length;
  }

  generate(): void {
    if (this.generating()) return;
    this.generating.set(true);
    this.error.set(null);
    this.justGenerated.set([]);
    const note = this.note.trim() || null;
    const expiresIn = this.expiresInDays && this.expiresInDays > 0 ? this.expiresInDays : null;
    this.api.generateInvites(this.count, note, expiresIn).subscribe({
      next: r => {
        this.generating.set(false);
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 86400000).toISOString() : null;
        this.justGenerated.set(r.codes.map(code => ({ code, expiresAt })));
        this.refresh();
      },
      error: err => {
        this.generating.set(false);
        this.error.set(err?.error?.message || 'Failed to generate codes.');
      },
    });
  }

  expiryLabel(expiresAt: string | null): string {
    if (!expiresAt) return 'never';
    const days = Math.round((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'expired';
    if (days === 0) return 'today';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  isExpired(expiresAt: string | null): boolean {
    return !!expiresAt && new Date(expiresAt).getTime() < Date.now();
  }

  private messageFor(code: string, expiresAt: string | null): string {
    const expiryText = expiresAt
      ? `Single use, expires in ${this.expiryLabel(expiresAt)}.`
      : 'Single use, no expiry.';
    return `Hey! You're invited to the Chatims closed beta. Use code ${code} to register at https://chatims.app. ${expiryText}`;
  }

  copyMessage(code: string, expiresAt: string | null): void {
    navigator.clipboard.writeText(this.messageFor(code, expiresAt)).then(
      () => { this.copyHint.set('Message copied'); setTimeout(() => this.copyHint.set(null), 1500); },
    );
  }

  copyAllMessages(items: { code: string; expiresAt: string | null }[]): void {
    const text = items.map(i => this.messageFor(i.code, i.expiresAt)).join('\n\n---\n\n');
    navigator.clipboard.writeText(text).then(
      () => { this.copyHint.set('All messages copied'); setTimeout(() => this.copyHint.set(null), 1500); },
    );
  }

  revoke(code: string): void {
    if (!confirm(`Revoke invite code ${code}? This cannot be undone.`)) return;
    this.api.revokeInvite(code).subscribe({
      next: () => this.refresh(),
      error: err => this.error.set(err?.error?.message || 'Failed to revoke.'),
    });
  }

  copyCodes(items: { code: string; expiresAt: string | null }[] | string[]): void {
    const codes = items.map(i => typeof i === 'string' ? i : i.code);
    navigator.clipboard.writeText(codes.join('\n')).then(
      () => { this.copyHint.set('Codes copied'); setTimeout(() => this.copyHint.set(null), 1500); },
      () => this.copyHint.set('Copy failed'),
    );
  }

  copyOne(code: string): void {
    navigator.clipboard.writeText(code).then(
      () => { this.copyHint.set(`Copied ${code}`); setTimeout(() => this.copyHint.set(null), 1500); },
    );
  }
}
