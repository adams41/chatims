import { Component, OnInit} from '@angular/core';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-splash-screen',
  imports: [LottieComponent],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
  
})
export class SplashScreenComponent implements OnInit {
 
  options: AnimationOptions = {    
    path: '/assets/animation/animation_dashboard.json',
    autoplay: false
  };  

  constructor() { }  

  ngOnInit(): void {  }
 
  onAnimate(animationItem: AnimationItem): void {    
    console.log(animationItem);  
  }
}
