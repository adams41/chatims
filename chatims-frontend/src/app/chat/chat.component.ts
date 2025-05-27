import { Component, OnInit } from '@angular/core';
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
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, NavbarComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messages: string[] = [];
  newMessage: string = '';

  userName: string | null = null;
  userAge: number | null = null;
  userPhoto: string | null = null;

  keycloakName: string | null = null;
  keycloakId: string | null = null;

  chatPartnerName = 'Test User';
  chatPartnerAge = 25;
  chatPartnerPhoto: string | null = null; 

  timer: any;
  totalSeconds: number = 5;
  minutes: number = 0;
  seconds: number = 5;

  constructor(
    private userService: UserService,
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeKeycloak();
    this.startTimer();
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
      console.error('Error initializing Keycloak:', error);
      this.router.navigate(['/']);
    }
  }

  loadUserDataByKeycloakId(keycloakId: string): void {
    this.userService.getUserByKeycloakId(keycloakId).subscribe({
      next: (user: { name: string | null; age: number | null; photoPath: any }) => {
        console.log('User data received:', user);
        this.userName = user.name;
        this.userAge = user.age;

        if (user.photoPath) {
          this.userPhoto = `http://localhost:8081${user.photoPath}`;
        }
      },
      error: (error: any) => {
        console.error('Error loading user data by Keycloak ID:', error);
        this.userName = this.keycloakName;
      }
    });
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(this.newMessage);
      this.newMessage = '';
    }
  }

  logout() {
    this.keycloakService.logout();
  }

  startTimer() {
    this.updateTimeDisplay();
    this.timer = setInterval(() => {
      this.totalSeconds--;
      this.updateTimeDisplay();

      if (this.totalSeconds <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  updateTimeDisplay() {
    this.minutes = Math.floor(this.totalSeconds / 60);
    this.seconds = this.totalSeconds % 60;
  }
}
