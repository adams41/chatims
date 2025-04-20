import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import lottie from 'lottie-web';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css'
})
export class ProgressBarComponent implements OnInit {
 
   
  @ViewChild('lottie', { static: true }) lottieContainer!: ElementRef;
 ngOnInit() { 
     lottie.loadAnimation({
       container: this.lottieContainer.nativeElement,
       path: '/assets/animation/animation-progress.json',
       renderer: 'svg',
       loop: true,
       autoplay: true
     });
   }
 }{

}
