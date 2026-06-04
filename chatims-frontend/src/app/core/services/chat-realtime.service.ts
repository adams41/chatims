import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatSession } from '../models';
import { KeycloakService } from './keycloak.service';

export interface TypingEvent {
  chatId: number;
  typing: boolean;
}

/**
 * STOMP client wrapping @stomp/stompjs. Owns a single connection that streams
 * three user-scoped destinations:
 *   /user/queue/messages   — new messages from the partner
 *   /user/queue/session    — chat status updates (like, end, expire)
 *   /user/queue/typing     — partner typing on/off
 *
 * The connection is established lazily on first connect() call. Reconnect is
 * handled by the underlying client with exponential backoff.
 */
@Injectable({ providedIn: 'root' })
export class ChatRealtimeService implements OnDestroy {
  private readonly keycloak = inject(KeycloakService);
  private readonly zone = inject(NgZone);

  private client: Client | null = null;
  private subs: StompSubscription[] = [];

  private readonly message$ = new Subject<ChatMessage>();
  private readonly session$ = new Subject<ChatSession>();
  private readonly typing$ = new Subject<TypingEvent>();
  private readonly connectionState$ = new Subject<'connected' | 'disconnected'>();

  /** Hot stream of new messages addressed to this user. */
  messages(): Observable<ChatMessage> { return this.message$.asObservable(); }
  /** Hot stream of session updates pushed by the server. */
  sessions(): Observable<ChatSession> { return this.session$.asObservable(); }
  /** Hot stream of typing on/off events from the current partner. */
  typing(): Observable<TypingEvent> { return this.typing$.asObservable(); }
  connectionState(): Observable<'connected' | 'disconnected'> {
    return this.connectionState$.asObservable();
  }

  connect(): void {
    if (this.client?.active) return;

    const token = this.keycloak.getToken();
    if (!token) {
      console.warn('[realtime] no JWT — skipping connect');
      return;
    }

    this.client = new Client({
      // SockJS is plain HTTP under the hood, so we feed the http(s) URL — not ws://.
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
      // STOMP-level auth. The server's StompAuthChannelInterceptor reads this on CONNECT.
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 2000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => {}, // silence stompjs's verbose console output
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

  /** Emit a typing on/off event. Caller throttles. */
  sendTyping(chatId: number, typing: boolean): void {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ chatId, typing }),
    });
  }

  private subscribeAll(): void {
    if (!this.client) return;
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
