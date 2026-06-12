import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatSession, RevealedProfile } from '../models';
import { KeycloakService } from './keycloak.service';

export interface TypingEvent {
  chatId: number;
  typing: boolean;
}

export interface MatchRemovedEvent {
  partnerId: number;
}

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService implements OnDestroy {
  private readonly keycloak = inject(KeycloakService);
  private readonly zone = inject(NgZone);

  private client: Client | null = null;
  private subs: StompSubscription[] = [];

  private readonly message$ = new Subject<ChatMessage>();
  private readonly session$ = new Subject<ChatSession>();
  private readonly typing$ = new Subject<TypingEvent>();
  private readonly matchRemoved$ = new Subject<MatchRemovedEvent>();
  private readonly reveal$ = new Subject<RevealedProfile>();
  private readonly connectionState$ = new Subject<'connected' | 'disconnected'>();

  messages(): Observable<ChatMessage> { return this.message$.asObservable(); }
  sessions(): Observable<ChatSession> { return this.session$.asObservable(); }
  typing(): Observable<TypingEvent> { return this.typing$.asObservable(); }
  matchRemoved(): Observable<MatchRemovedEvent> { return this.matchRemoved$.asObservable(); }
  reveals(): Observable<RevealedProfile> { return this.reveal$.asObservable(); }
  connectionState(): Observable<'connected' | 'disconnected'> {
    return this.connectionState$.asObservable();
  }

  connect(): void {
    if (this.client?.active) return;

    const token = this.keycloak.getToken();
    if (!token) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 2000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => {},
      onConnect: () => this.zone.run(() => {
        this.subscribeAll();
        this.connectionState$.next('connected');
      }),
      onWebSocketClose: () => this.zone.run(() => this.connectionState$.next('disconnected')),
      onStompError: (frame: IFrame) => {
        console.warn('[realtime] STOMP error', frame.headers['message'], frame.body);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    this.client?.deactivate();
    this.client = null;
  }

  sendTyping(chatId: number, typing: boolean): void {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ chatId, typing }),
    });
  }

  private subscribeAll(): void {
    if (!this.client) return;
    this.subs.forEach(s => { try { s.unsubscribe(); } catch {} });
    this.subs = [];
    this.subs.push(
      this.client.subscribe('/user/queue/messages', (m: IMessage) =>
        this.zone.run(() => this.safeParse<ChatMessage>(m, this.message$))
      ),
      this.client.subscribe('/user/queue/session', (m: IMessage) =>
        this.zone.run(() => this.safeParse<ChatSession>(m, this.session$))
      ),
      this.client.subscribe('/user/queue/typing', (m: IMessage) =>
        this.zone.run(() => this.safeParse<TypingEvent>(m, this.typing$))
      ),
      this.client.subscribe('/user/queue/match-removed', (m: IMessage) =>
        this.zone.run(() => this.safeParse<MatchRemovedEvent>(m, this.matchRemoved$))
      ),
      this.client.subscribe('/user/queue/reveal', (m: IMessage) =>
        this.zone.run(() => this.safeParse<RevealedProfile>(m, this.reveal$))
      ),
    );
  }

  private safeParse<T>(m: IMessage, subject: Subject<T>): void {
    try {
      subject.next(JSON.parse(m.body) as T);
    } catch (e) {
      console.warn('[realtime] failed to parse frame body', e);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
