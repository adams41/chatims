import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router'; 
import lottie from 'lottie-web'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  imports: [MatButtonModule,
    MatIconModule, CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
  
})
export class SplashScreenComponent implements OnInit {
  @ViewChild('lottie', { static: true }) lottieContainer!: ElementRef;

  constructor(private router: Router) {}

   ngOnInit() { 
       lottie.loadAnimation({
         container: this.lottieContainer.nativeElement,
         path: '/assets/animation/animation.json',
         renderer: 'svg',
         loop: true,
         autoplay: true
       });
     }

  goToRegister() {
    this.router.navigate(['/register']);
  }

   }
