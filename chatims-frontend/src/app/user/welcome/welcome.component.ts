import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../../utils/keycloak/keycloak.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
  standalone: true,
  imports: [CommonModule],
})
export class WelcomeComponent implements OnInit {
  userName: string = '';
  isLoading: boolean = true;

  constructor(
    private userService: UserService,
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  async loadUserInfo() {
    try {
      await this.keycloakService.init();

      if (!this.keycloakService.isTokenValid) {
        this.router.navigate(['/']);
        return;
      }

      const keycloakId = this.keycloakService.userId;

      if (!keycloakId) {
        this.isLoading = false;
        this.router.navigate(['/']);
        return;
      }

      this.userService.getUserByKeycloakId(keycloakId).subscribe({
        next: (user) => {
          this.userService.setUserId(user.id);
          this.isLoading = false;

          const hasName = user && user.name && user.name.trim();

          if (hasName) {
            this.userName = user.name;
            this.userService.setUserName(user.name);
          }

          if (hasName && user.preferencesSet) {
            this.autoNavigate('/chat');
          } else {
            this.autoNavigate('/chat-preferences');
          }
        },
        error: () => {
          this.isLoading = false;
          this.autoNavigate('/chat-preferences');
        },
      });
    } catch {
      this.isLoading = false;
      this.router.navigate(['/']);
    }
  }

  autoNavigate(path: string, delayMs: number = 3000): void {
    setTimeout(() => {
      this.router.navigate([path]);
    }, delayMs);
  }
}
