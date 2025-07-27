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
import { NavbarComponent } from '../shared/navbar/navbar/navbar.component';
import { UserService } from '../services/user.service';
import confetti from 'canvas-confetti';

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
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('confettiCanvas', { static: false }) confettiCanvas!: ElementRef<HTMLCanvasElement>;


  userName: string | null = null;
  userAge: number | null = null;
  userPhoto: string | null = null;

  keycloakName: string | null = null;
  keycloakId: string | null = null;

  chatPartnerName = 'Test User';
  chatPartnerAge = 25;
  chatPartnerPhoto: string | null = null;
  private matchSound = new Audio('assets/sound/match-sound.mp3');

  messages: {
    text: string;
    from: 'user' | 'partner';
    time: Date;
    read?: boolean;
    sent?: boolean;
  }[] = [];
  newMessage: string = '';
  selectedMessageIndex: number | null = null;

  showMatchScreen = false;
  isSlidingOutRight = false;
  isProfileModalOpen = false;
  isEditingProfile = false;
  isConfirmOpen = false;

  timer: any;
  totalSeconds = 300;
  minutes = 5;
  seconds = 0;

  partnerTyping = false;
  private typingTimeout: any;
  private confirmCallback: (() => void) | null = null;

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

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
  }

  private markUnreadPartnerMessagesAsRead(): void {
    this.messages.forEach((msg) => {
      if (msg.from === 'partner' && !msg.read) msg.read = true;
    });
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
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
        if (this.keycloakId) this.loadUserDataByKeycloakId(this.keycloakId);
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
        this.userPhoto = this.getUserPhotoUrl(user.photoPath);
      },
      error: (error) => {
        console.error('User load error:', error);
        this.userName = this.keycloakName;
      },
    });
  }

  private getUserPhotoUrl(photoPath: string | null): string | null {
    return photoPath ? `http://localhost:8081${photoPath}` : null;
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const userMessage = {
      text: this.newMessage,
      from: 'user' as const,
      time: new Date(),
      sent: true,
    };
    this.messages.push(userMessage);
    this.playSound('send');
    this.newMessage = '';
    this.triggerPartnerReply(userMessage.text);
  }

  private triggerPartnerReply(text: string): void {
    this.partnerTyping = true;
    if (this.typingTimeout) clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      this.partnerTyping = false;
      this.messages.push({
        text: `Auto-reply: "${text}"`,
        from: 'partner',
        time: new Date(),
      });
      this.playSound('receive'); 

    if (text.toLowerCase().includes('yes')) {
  this.showMatchScreen = true;
  this.launchConfetti();

  this.matchSound
    .play()
    .catch((err) => console.error('Sound error:', err));
}
    }, 2000);
  }

  selectMessage(index: number): void {
    this.selectedMessageIndex =
      this.selectedMessageIndex === index ? null : index;
  }

  private playSound(type: 'send' | 'receive') {
  const audio = new Audio(`assets/sound/send-message.mp3`);
  audio.volume = 0.3; 
  audio.play().catch(() => {});
}

  launchConfetti(): void {
  const myConfetti = confetti.create(this.confettiCanvas.nativeElement, {
    resize: true,
    useWorker: true,
  });

  myConfetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
  });
}

  logout(): void {
    this.keycloakService.logout();
  }

  startTimer(): void {
    this.updateTimeDisplay();
    this.timer = setInterval(() => {
      this.totalSeconds--;
      this.updateTimeDisplay();
      if (this.totalSeconds <= 0) clearInterval(this.timer);
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
    this.isEditingProfile = false;
    this.isProfileModalOpen = false;
  }

  cancelEdit(): void {
    this.isEditingProfile = false;
  }

  openConfirm(callback: () => void): void {
    this.isConfirmOpen = true;
    this.confirmCallback = callback;
  }

  handleConfirm(result: boolean): void {
    this.isConfirmOpen = false;
    if (result && this.confirmCallback) this.confirmCallback();
    this.confirmCallback = null;
  }

  startNewChat(): void {
    this.openConfirm(() => {
      this.isSlidingOutRight = true;
      setTimeout(() => {
        this.resetChatState();
        this.isSlidingOutRight = false;
      }, 500);
    });
  }

  closeMatchAndStartNewChat(): void {
    this.showMatchScreen = false;
    this.startNewChatWithoutConfirm();
  }

  startNewChatWithoutConfirm(): void {
    this.isSlidingOutRight = true;
    setTimeout(() => {
      this.resetChatState();
      this.isSlidingOutRight = false;
    }, 500);
  }

  private resetChatState(): void {
    this.messages = [];
    this.chatPartnerName = '';
    this.chatPartnerPhoto = null;
    this.chatPartnerAge = 25;
    this.newMessage = '';
    this.totalSeconds = 300;
    this.updateTimeDisplay();
    this.showMatchScreen = false;
  }

 
}
