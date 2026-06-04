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
import { ChatMessage, ChatSession, RevealedProfile, UserProfile } from '../core/models';
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

  private routeSub?: Subscription;
  private realtimeSubs: Subscription[] = [];
  private timerSub?: Subscription;
  private shouldScrollToBottom = false;
  private initialMatchState = false;
  private lastTypingEmitAt = 0;
  private typingFadeHandle: ReturnType<typeof setTimeout> | null = null;

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
        if (wasActive && session.status === 'ENDED' && session.remainingSeconds > 0) {
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
      this.realtime.connectionState().subscribe(state => {
        this.connectionLost.set(state === 'disconnected');
      }),
    );
  }

  private resetState(): void {
    this.timerSub?.unsubscribe();
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

  photoUrl(path: string | null): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  newSearch(): void {
    this.timerSub?.unsubscribe();
    this.chatApi.leaveChat(this.chatId).subscribe({
      next: () => this.goToMatchmaking(),
      error: () => this.goToMatchmaking(),
    });
  }

  skipPartner(): void {
    this.timerSub?.unsubscribe();
    this.chatApi.leaveChat(this.chatId).subscribe({
      next: () => this.goToMatchmaking(),
      error: () => this.goToMatchmaking(),
    });
  }

  private goToMatchmaking(): void {
    this.router.navigate(['/matchmaking']);
  }

  logout(): void {
    this.realtime.disconnect();
    this.keycloak.logout();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private loadSession(): void {
    this.chatApi.getSession(this.chatId).subscribe({
      next: session => {
        this.session.set(session);
        this.initialMatchState = session.mutualMatch; // snapshot — don't auto-reveal pre-existing matches
        this.loadingChat.set(false);
      },
      error: () => {
        this.loadingChat.set(false);
        this.errorMessage.set('Could not load chat.');
      },
    });
  }

  private loadMessages(): void {
    this.chatApi.getMessages(this.chatId).subscribe(msgs => {
      this.messages.set(msgs);
      this.shouldScrollToBottom = true;
    });
  }

  private startCountdown(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => {
      const s = this.session();
      if (!s) return;
      if (s.remainingSeconds > 0) {
        this.session.set({ ...s, remainingSeconds: s.remainingSeconds - 1 });
      }
    });
  }
}
