import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage, ChatSession, INTENT_LABELS, Intent, RevealedProfile, UserProfile } from '../core/models';
import { ChatApiService } from '../core/services/chat-api.service';
import { ChatRealtimeService, TypingEvent } from '../core/services/chat-realtime.service';
import { UserApiService } from '../core/services/user-api.service';
import { KeycloakService } from '../core/services/keycloak.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

const TYPING_EMIT_THROTTLE_MS = 1500;
const TYPING_FADE_MS = 3000;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly chatApi = inject(ChatApiService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly userApi = inject(UserApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);

  searchingNew = signal(false);
  searchError = signal<string | null>(null);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  chatId!: number;
  me = signal<UserProfile | null>(null);
  session = signal<ChatSession | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  revealed = signal<RevealedProfile | null>(null);
  partnerTyping = signal(false);
  partnerLeftEarly = signal(false);

  sending = signal(false);
  liking = signal(false);
  loadingChat = signal(true);
  errorMessage = signal<string | null>(null);
  connectionLost = signal(false);
  showLeaveConfirm = signal(false);
  leavingFor = signal<'profile' | 'matchmaking' | null>(null);
  showReportModal = signal(false);
  reporting = signal(false);
  reportError = signal<string | null>(null);
  reportReason = '';
  reportDetails = '';
  sharingContacts = signal(false);
  viewerPhotos = signal<string[] | null>(null);
  viewerIndex = signal(0);

  private routeSub?: Subscription;
  private realtimeSubs: Subscription[] = [];
  private timerSub?: Subscription;
  private pollSub?: Subscription;
  private shouldScrollToBottom = false;
  private initialMatchState = false;
  private lastTypingEmitAt = 0;
  private typingFadeHandle: ReturnType<typeof setTimeout> | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchTracking = false;

  ngOnInit(): void {
    this.realtime.connect();
    this.wireRealtime();

    this.routeSub = this.route.paramMap.subscribe(params => {
      const newId = Number(params.get('id'));
      if (newId === this.chatId) return;
      this.chatId = newId;
      this.resetState();
      this.userApi.me().subscribe({
        next: profile => {
          this.me.set(profile);
          this.loadSession();
          this.loadMessages();
          this.startCountdown();
          this.startMessagePolling();
        },
        error: () => this.router.navigate(['/welcome']),
      });
    });
  }

  private wireRealtime(): void {
    this.realtimeSubs.push(
      this.realtime.messages().subscribe(msg => {
        if (msg.chatId !== this.chatId) return;
        const existing = this.messages();
        if (existing.some(m => m.id === msg.id)) return;
        this.messages.set([...existing, msg]);
        this.shouldScrollToBottom = true;
      }),
      this.realtime.sessions().subscribe(session => {
        if (session.chatId !== this.chatId) return;
        const wasActive = this.session()?.status === 'ACTIVE';
        const endedAtIso = this.session()?.endsAt;
        const stillHasTime = endedAtIso ? new Date(endedAtIso).getTime() > Date.now() : false;
        if (wasActive && session.status === 'ENDED' && stillHasTime) {
          this.partnerLeftEarly.set(true);
        }
        this.session.set(session);
        if (session.mutualMatch && !this.revealed() && !this.initialMatchState) {
          this.fetchReveal();
        }
      }),
      this.realtime.typing().subscribe((evt: TypingEvent) => {
        if (evt.chatId !== this.chatId) return;
        this.partnerTyping.set(evt.typing);
        if (this.typingFadeHandle) clearTimeout(this.typingFadeHandle);
        if (evt.typing) {
          this.typingFadeHandle = setTimeout(
            () => this.partnerTyping.set(false),
            TYPING_FADE_MS,
          );
        }
      }),
      this.realtime.reveals().subscribe(profile => {
        if (this.revealed()?.userId === profile.userId || profile.userId === this.session()?.partner?.userId) {
          this.revealed.set(profile);
        }
      }),
      this.realtime.connectionState().subscribe(state => {
        this.connectionLost.set(state === 'disconnected');
        if (state === 'connected' && this.chatId) {
          this.loadMessages();
        }
      }),
    );
  }

  private resetState(): void {
    this.timerSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    this.session.set(null);
    this.messages.set([]);
    this.revealed.set(null);
    this.partnerTyping.set(false);
    this.partnerLeftEarly.set(false);
    this.loadingChat.set(true);
    this.errorMessage.set(null);
    this.searchError.set(null);
    this.searchingNew.set(false);
    this.initialMatchState = false;
    if (this.typingFadeHandle) {
      clearTimeout(this.typingFadeHandle);
      this.typingFadeHandle = null;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.realtimeSubs.forEach(s => s.unsubscribe());
    this.timerSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    if (this.typingFadeHandle) clearTimeout(this.typingFadeHandle);
  }

  isMine(msg: ChatMessage): boolean {
    return msg.senderId === this.me()?.id;
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    if (!text || this.sending() || this.isEnded()) return;
    this.sending.set(true);
    this.chatApi.sendMessage(this.chatId, text).subscribe({
      next: msg => {
        this.messages.update(arr => arr.some(m => m.id === msg.id) ? arr : [...arr, msg]);
        this.shouldScrollToBottom = true;
        this.newMessage = '';
        this.sending.set(false);
        this.realtime.sendTyping(this.chatId, false);
      },
      error: err => {
        this.sending.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send message.');
      },
    });
  }

  onTyping(): void {
    const now = Date.now();
    if (now - this.lastTypingEmitAt < TYPING_EMIT_THROTTLE_MS) return;
    this.lastTypingEmitAt = now;
    this.realtime.sendTyping(this.chatId, this.newMessage.trim().length > 0);
  }

  like(): void {
    if (this.liking() || this.session()?.youLiked) return;
    this.liking.set(true);
    this.chatApi.like(this.chatId).subscribe({
      next: session => {
        this.session.set(session);
        this.liking.set(false);
        if (session.mutualMatch) {
          this.fetchReveal();
        }
      },
      error: err => {
        this.liking.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to like.');
      },
    });
  }

  fetchReveal(): void {
    this.chatApi.reveal(this.chatId).subscribe({
      next: profile => {
        this.revealed.set(profile);
        this.timerSub?.unsubscribe();
      },
      error: err => console.warn('Reveal not ready yet', err),
    });
  }

  isEnded(): boolean {
    const s = this.session();
    return !!s && (s.status === 'ENDED' || s.remainingSeconds <= 0);
  }

  remainingDisplay(): string {
    const s = this.session();
    if (!s) return '7:00';
    const total = Math.max(0, s.remainingSeconds);
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  intentLabel(i: Intent | null | undefined): string {
    return i ? INTENT_LABELS[i] : '';
  }

  photoUrl(path: string | null): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  newSearch(): void { this.leaveAndNavigate('matchmaking'); }

  skipPartner(): void {
    if (this.isEnded()) { this.leaveAndNavigate('matchmaking'); return; }
    this.showLeaveConfirm.set(true);
    this.leavingFor.set('matchmaking');
  }

  goToProfile(): void {
    if (this.isEnded()) { this.router.navigate(['/profile']); return; }
    this.showLeaveConfirm.set(true);
    this.leavingFor.set('profile');
  }

  cancelLeave(): void {
    this.showLeaveConfirm.set(false);
    this.leavingFor.set(null);
  }

  confirmLeave(): void {
    const dest = this.leavingFor() ?? 'matchmaking';
    this.showLeaveConfirm.set(false);
    this.leaveAndNavigate(dest);
  }

  openRevealPhotos(r: RevealedProfile): void {
    const photos = (r.photos && r.photos.length > 0) ? r.photos : (r.photoPath ? [r.photoPath] : []);
    if (photos.length === 0) return;
    this.viewerPhotos.set(photos);
    this.viewerIndex.set(0);
  }

  closeViewer(): void { this.viewerPhotos.set(null); }

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

  private leaveAndNavigate(dest: 'profile' | 'matchmaking'): void {
    this.timerSub?.unsubscribe();
    const route = dest === 'profile' ? '/profile' : '/matchmaking';
    this.chatApi.leaveChat(this.chatId).subscribe({
      next: () => this.router.navigate([route]),
      error: () => this.router.navigate([route]),
    });
  }

  logout(): void {
    this.realtime.disconnect();
    this.keycloak.logout();
  }

  openReport(): void {
    this.reportReason = '';
    this.reportDetails = '';
    this.reportError.set(null);
    this.showReportModal.set(true);
  }

  closeReport(): void {
    this.showReportModal.set(false);
  }

  shareContacts(): void {
    if (this.sharingContacts()) return;
    this.sharingContacts.set(true);
    this.chatApi.shareContacts(this.chatId).subscribe({
      next: profile => {
        this.revealed.set(profile);
        this.sharingContacts.set(false);
      },
      error: err => {
        this.sharingContacts.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to share contacts.');
      },
    });
  }

  submitReport(): void {
    if (!this.reportReason || this.reporting()) return;
    const partnerId = this.session()?.partner?.userId;
    if (!partnerId) return;
    this.reporting.set(true);
    this.reportError.set(null);
    this.userApi.reportUser(partnerId, this.reportReason, this.chatId, this.reportDetails || null).subscribe({
      next: () => {
        this.reporting.set(false);
        this.showReportModal.set(false);
      },
      error: err => {
        this.reporting.set(false);
        this.reportError.set(err.error?.message || 'Failed to submit report.');
      },
    });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onTouchStart(e: TouchEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('textarea, input, button, a, .messages')) {
      this.touchTracking = false;
      return;
    }
    const t = e.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.touchTracking = true;
  }

  onTouchMove(e: TouchEvent): void {
    if (!this.touchTracking) return;
    const t = e.touches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    if (Math.abs(dy) > Math.abs(dx)) {
      this.touchTracking = false;
    }
  }

  onTouchEnd(e: TouchEvent): void {
    if (!this.touchTracking) return;
    this.touchTracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    if (Math.abs(dx) < 80 || Math.abs(dy) > 60) return;
    if (dx < 0) {
      this.skipPartner();
    }
  }

  private loadSession(): void {
    this.chatApi.getSession(this.chatId).subscribe({
      next: session => {
        this.session.set(session);
        this.initialMatchState = session.mutualMatch;
        this.loadingChat.set(false);
      },
      error: () => {
        this.loadingChat.set(false);
        this.errorMessage.set('Could not load chat.');
      },
    });
  }

  private loadMessages(): void {
    this.chatApi.getMessages(this.chatId).subscribe({
      next: msgs => {
        this.messages.update(existing => {
          const seen = new Set(existing.map(m => m.id));
          const merged = [...existing];
          for (const m of msgs) {
            if (!seen.has(m.id)) merged.push(m);
          }
          merged.sort((a, b) => a.id - b.id);
          return merged;
        });
        this.shouldScrollToBottom = true;
      },
      error: err => {
        console.warn('[chat] loadMessages failed', err?.status, err?.error);
      },
    });
  }

  private startCountdown(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => {
      const s = this.session();
      if (!s || !s.endsAt) return;
      const remaining = Math.max(0, Math.floor((new Date(s.endsAt).getTime() - Date.now()) / 1000));
      if (remaining !== s.remainingSeconds) {
        this.session.set({ ...s, remainingSeconds: remaining });
      }
    });
  }

  private startMessagePolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(3000).subscribe(() => {
      if (!this.chatId || this.isEnded()) return;
      this.loadMessages();
      this.chatApi.getSession(this.chatId).subscribe({
        next: session => {
          const wasActive = this.session()?.status === 'ACTIVE';
          const endedAtIso = this.session()?.endsAt;
          const stillHasTime = endedAtIso ? new Date(endedAtIso).getTime() > Date.now() : false;
          if (wasActive && session.status === 'ENDED' && stillHasTime) {
            this.partnerLeftEarly.set(true);
          }
          this.session.set(session);
          if (session.mutualMatch && !this.revealed() && !this.initialMatchState) {
            this.fetchReveal();
          }
        },
        error: () => {},
      });
    });
  }
}
