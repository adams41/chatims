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
     
    this.userName = this.userService.getUserName();
    this.userAge = this.userService.getUserAge();
    this.userPhoto = this.userService.getUserPhoto();
 
  }
  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(this.newMessage);
      this.newMessage = '';
    }
  }
}
