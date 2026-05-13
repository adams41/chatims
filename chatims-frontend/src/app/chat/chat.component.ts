import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
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
import { Subscription, interval, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage, ChatSession, RevealedProfile, UserProfile } from '../core/models';
import { ChatApiService } from '../core/services/chat-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { KeycloakService } from '../core/services/keycloak.service';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly chatApi = inject(ChatApiService);
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

  sending = signal(false);
  liking = signal(false);
  loadingChat = signal(true);
  errorMessage = signal<string | null>(null);

  private pollSub?: Subscription;
  private timerSub?: Subscription;
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  private initialMatchState = false;
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const newId = Number(params.get('id'));
      if (newId === this.chatId) return; 
      this.chatId = newId;
      this.resetState();
      this.userApi.me().subscribe({
        next: profile => {
          this.me.set(profile);
          this.loadSession();
          this.loadMessages();
          this.startPolling();
          this.startCountdown();
        },
        error: () => this.router.navigate(['/welcome']),
      });
    });
  }

  private resetState(): void {
    this.pollSub?.unsubscribe();
    this.timerSub?.unsubscribe();
    this.session.set(null);
    this.messages.set([]);
    this.revealed.set(null);
    this.loadingChat.set(true);
    this.errorMessage.set(null);
    this.searchError.set(null);
    this.searchingNew.set(false);
    this.lastMessageCount = 0;
    this.initialMatchState = false;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.timerSub?.unsubscribe();
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
        this.messages.update(arr => [...arr, msg]);
        this.shouldScrollToBottom = true;
        this.newMessage = '';
        this.sending.set(false);
      },
      error: err => {
        this.sending.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send message.');
      },
    });
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
      next: profile => this.revealed.set(profile),
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
    this.revealed.set(null);
    this.goToMatchmaking();
  }

  skipPartner(): void {
    this.chatApi.leaveChat(this.chatId).subscribe({
      next: () => this.goToMatchmaking(),
      error: () => this.goToMatchmaking(),
    });
  }

  private goToMatchmaking(): void {
    this.router.navigate(['/matchmaking']);
  }

  logout(): void {
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
      if (msgs.length !== this.lastMessageCount) {
        this.shouldScrollToBottom = true;
        this.lastMessageCount = msgs.length;
      }
    });
  }

  private startPolling(): void {
    this.pollSub?.unsubscribe();

    const msgPoll = interval(2000)
      .pipe(switchMap(() => this.chatApi.getMessages(this.chatId)))
      .subscribe({
        next: msgs => {
          if (msgs.length !== this.messages().length) {
            this.messages.set(msgs);
            this.shouldScrollToBottom = true;
          }
        },
        error: () => {},
      });

    const sessionPoll = interval(5000)
      .pipe(switchMap(() => this.chatApi.getSession(this.chatId)))
      .subscribe({
        next: session => {
          this.session.set(session);
          if (session.mutualMatch && !this.revealed() && !this.initialMatchState) {
            this.fetchReveal();
          }
        },
        error: () => { },
      });

    this.pollSub = msgPoll;
    this.pollSub.add(sessionPoll);
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
