import { Component, OnInit} from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
  
})
export class SplashScreenComponent implements OnInit {

  // This is the option that uses the package's AnimationOption interface  
  options: AnimationOptions = {    
    path: '/assets/animation/animation_dashboard.json'  
  };  

  constructor() { }  

  ngOnInit(): void {  }

  // This is the component function that binds to the animationCreated event from the package  
  onAnimate(animationItem: AnimationItem): void {    
    console.log(animationItem);  
  }
}
