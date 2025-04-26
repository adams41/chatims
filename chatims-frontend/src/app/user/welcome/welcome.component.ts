import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {
  userName: string | null = null;

  constructor(private userService: UserService, private router: Router,) {}


  ngOnInit(): void {   
    this.userName = this.userService.getUserName(); 
    setTimeout(() => {
    this.router.navigate(['/chat-preferences']);
    }, 3000);
     

  }
}
