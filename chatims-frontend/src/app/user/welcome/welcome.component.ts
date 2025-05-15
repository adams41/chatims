import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { KeycloakService } from '../../utils/keycloak/keycloak.service';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {
  userName: string = '';

  constructor(private userService: UserService,
    private router: Router,
    private keycloakService: KeycloakService,) {}

    ngOnInit(): void {
      this.userName = this.keycloakService.fullName;


    setTimeout(() => {
    this.router.navigate(['/chat-preferences']);
    }, 3000);

  }

}
