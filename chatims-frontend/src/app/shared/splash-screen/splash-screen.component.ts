import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import lottie from 'lottie-web';

@Component({
  selector: 'app-splash-screen',
  imports: [],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
  
})
export class SplashScreenComponent implements OnInit {
 
   
    @ViewChild('lottie', { static: true }) lottieContainer!: ElementRef;
   ngOnInit() { 
       lottie.loadAnimation({
         container: this.lottieContainer.nativeElement,
         path: '/assets/animation/animation.json',
         renderer: 'svg',
         loop: true,
         autoplay: true
       });
     }
   }
