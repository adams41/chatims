import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild
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
    NavbarComponent
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: { text: string; from: 'user'; time: Date }[] = [];
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

  timer: any;
  totalSeconds: number = 300;
  minutes: number = 5;
  seconds: number = 0;

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
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
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
      }
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.messages.push({
        text: this.newMessage,
        from: 'user',
        time: new Date()
      });
      this.newMessage = '';
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
}

closeProfileModal(): void {
  this.isProfileModalOpen = false;
}

editProfile(): void {
  console.log('Edit profile clicked');
}
}
