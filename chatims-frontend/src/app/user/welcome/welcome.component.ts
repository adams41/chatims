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
  imports: [CommonModule]
})
export class WelcomeComponent implements OnInit {
  userName: string = '';
  isLoading: boolean = true;
  
  constructor(private userService: UserService,
    private router: Router,
    private keycloakService: KeycloakService,) {}
    
  ngOnInit(): void {
    this.loadUserInfo();
  }
    
  async loadUserInfo() {
    try { 
      await this.keycloakService.init();
      
      if (this.keycloakService.isTokenValid) { 
        const keycloakName = this.keycloakService.fullName;
        
        if (keycloakName) {
          this.userName = keycloakName;
          this.userService.setUserName(keycloakName);
          this.isLoading = false;
          this.autoNavigateToChat();
        } else { 
          const keycloakId = this.keycloakService.userId;
          if (keycloakId) {
            this.userService.getUserByKeycloakId(keycloakId).subscribe({
              next: (user) => {
                this.userName = user.name;
                this.isLoading = false;
                this.autoNavigateToChat();
              },
              error: (error) => {
                console.error('Error fetching user data:', error);
                this.isLoading = false;
              
              }
            });
          } else {
            this.isLoading = false;
          }
        }
      } else {
         
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      this.isLoading = false;
      this.router.navigate(['/']);
    }
  }
 
  autoNavigateToChat() {
    setTimeout(() => {
      this.router.navigate(['/chat-preferences']);
    }, 3000);  
  }
}