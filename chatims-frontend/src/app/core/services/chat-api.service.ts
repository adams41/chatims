import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatSession, RevealedProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getSession(chatId: number): Observable<ChatSession> {
    return this.http.get<ChatSession>(`${this.base}/chats/${chatId}`);
  }

  getMessages(chatId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/chats/${chatId}/messages`);
  }

  sendMessage(chatId: number, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/chats/${chatId}/messages`, { content });
  }

  like(chatId: number): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.base}/chats/${chatId}/like`, {});
  }

  reveal(chatId: number): Observable<RevealedProfile> {
    return this.http.get<RevealedProfile>(`${this.base}/chats/${chatId}/reveal`);
  }

  shareContacts(chatId: number): Observable<RevealedProfile> {
    return this.http.post<RevealedProfile>(`${this.base}/chats/${chatId}/share-contacts`, {});
  }

  leaveChat(chatId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/chats/${chatId}`);
  }
}
