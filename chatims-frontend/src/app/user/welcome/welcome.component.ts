import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {
  userName: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
   
    this.userName = this.userService.getUserName();
  }
}
