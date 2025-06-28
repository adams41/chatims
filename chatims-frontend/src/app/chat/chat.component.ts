import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KeycloakService } from '../utils/keycloak/keycloak.service';
import { UserService } from '../services/user/user.service';
import { NavbarComponent } from '../shared/navbar/navbar/navbar.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    NavbarComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    clearTimeout(this.typingTimeout);
  }

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: {
    text: string;
    from: 'user' | 'partner';
    time: Date;
    read?: boolean;
    sent?: boolean;
  }[] = [];

  newMessage: string = '';

  userName: string | null = null;
  userAge: number | null = null;
  userPhoto: string | null = null;

  keycloakName: string | null = null;
  keycloakId: string | null = null;

  chatPartnerName = 'Test User';
  chatPartnerAge = 25;
  chatPartnerPhoto: string | null = null;

  selectedMessageIndex: number | null = null;

  isProfileModalOpen: boolean = false;
  isEditingProfile: boolean = false;

  timer: any;
  totalSeconds: number = 300;
  minutes: number = 5;
  seconds: number = 0;

  partnerTyping = false;
  private typingTimeout: any;

  constructor(
    private userService: UserService,
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeKeycloak();
    this.startTimer();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
    this.markUnreadPartnerMessagesAsRead();
  }

  markUnreadPartnerMessagesAsRead(): void {
    this.messages.forEach((msg) => {
      if (msg.from === 'partner' && !msg.read) {
        msg.read = true;
      }
    });
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  isMessageRead(index: number): boolean {
    const message = this.messages[index];
    return (
      message.from === 'user' &&
      !!message.sent &&
      this.messages.some((m) => m.from === 'partner' && m.time > message.time)
    );
  }

  sendQuickReply(text: string): void {
    this.newMessage = text;
    this.sendMessage();
  }

  async initializeKeycloak(): Promise<void> {
    try {
      await this.keycloakService.init();

      if (this.keycloakService.isTokenValid) {
        this.keycloakName = this.keycloakService.fullName;
        this.keycloakId = this.keycloakService.userId;

        if (this.keycloakId) {
          this.loadUserDataByKeycloakId(this.keycloakId);
        }
      } else {
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Keycloak init error:', error);
      this.router.navigate(['/']);
    }
  }

  loadUserDataByKeycloakId(keycloakId: string): void {
    this.userService.getUserByKeycloakId(keycloakId).subscribe({
      next: (user) => {
        this.userName = user.name;
        this.userAge = user.age;
        if (user.photoPath) {
          this.userPhoto = `http://localhost:8081${user.photoPath}`;
        }
      },
      error: (error) => {
        console.error('User load error:', error);
        this.userName = this.keycloakName;
      },
    });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const userMessage = {
        text: this.newMessage,
        from: 'user' as const,
        time: new Date(),
        sent: true,
      };
      this.messages.push(userMessage);
      this.newMessage = '';

      this.partnerTyping = true;
      clearTimeout(this.typingTimeout);

      this.typingTimeout = setTimeout(() => {
        this.partnerTyping = false;

        this.messages.push({
          text: `Auto-reply: "${userMessage.text}"`,
          from: 'partner' as const,
          time: new Date(),
        });
      }, 2000);
    }
  }

  selectMessage(index: number): void {
    this.selectedMessageIndex =
      this.selectedMessageIndex === index ? null : index;
  }

  logout(): void {
    this.keycloakService.logout();
  }

  startTimer(): void {
    this.updateTimeDisplay();
    this.timer = setInterval(() => {
      this.totalSeconds--;
      this.updateTimeDisplay();
      if (this.totalSeconds <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  updateTimeDisplay(): void {
    this.minutes = Math.floor(this.totalSeconds / 60);
    this.seconds = this.totalSeconds % 60;
  }

  openProfileModal(): void {
    this.isProfileModalOpen = true;
    this.isEditingProfile = false;
  }

  closeProfileModal(): void {
    this.isProfileModalOpen = false;
    this.isEditingProfile = false;
  }

  editProfile(): void {
    this.isEditingProfile = true;
  }

  saveProfile(): void {
    console.log('Profile saved:', this.userName, this.userAge);
    this.isEditingProfile = false;
    this.isProfileModalOpen = false;
  }

  cancelEdit(): void {
    this.isEditingProfile = false;
  }

  isConfirmOpen = false;
  confirmCallback: (() => void) | null = null;

  openConfirm(callback: () => void) {
    this.isConfirmOpen = true;
    this.confirmCallback = callback;
  }

  confirmYes() {
    this.isConfirmOpen = false;
    if (this.confirmCallback) {
      this.confirmCallback();
    }
  }

  confirmNo() {
    this.isConfirmOpen = false;
    this.confirmCallback = null;
  }

  isSlidingOutRight = false;

  startNewChat() {
    this.openConfirm(() => {
      this.isSlidingOutRight = true;

      setTimeout(() => {
        this.resetChatState();
        this.isSlidingOutRight = false;
      }, 500);
    });
  }

  private resetChatState(): void {
    this.messages = [];
    this.chatPartnerName = '';
    this.chatPartnerPhoto = null;
    this.chatPartnerAge = 25;
    this.newMessage = '';
    this.totalSeconds = 300;
    this.updateTimeDisplay();
  }
}
