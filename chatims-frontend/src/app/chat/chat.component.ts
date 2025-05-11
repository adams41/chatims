import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messages: string[] = [];
  newMessage: string = '';
  userName: string | null = null;
  userAge: number | null = null;
  userPhoto: string | null = null;
  
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUserData();
}

loadUserData(): void {
    this.userService.getUserData(1).subscribe({
        next: (user) => {
            console.log('User data received:', user);
            this.userName = this.userService.getUserName();
            this.userAge = this.userService.getUserAge();
            this.userPhoto = this.userService.getUserPhoto();
            if (this.userPhoto) {
                this.userPhoto = `http://localhost:8081${this.userPhoto}`;
            }  
            console.log('Registered userPhoto:', this.userPhoto);
        },
        error: (error) => {
            console.error('Error by loading user data:', error);
            this.userPhoto = null;
        }
    });
}
  
  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(this.newMessage);
      this.newMessage = '';
    }
  }
}
