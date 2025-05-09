import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, PLATFORM_ID, Inject } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css'
})
export class ProgressBarComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
   
  @ViewChild('lottie', { static: true }) lottieContainer!: ElementRef;
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('lottie-web').then((lottieModule) => {
        const lottie = lottieModule.default;
        lottie.loadAnimation({
          container: this.lottieContainer.nativeElement,
          path: '/assets/animation/animation-progress.json',
          renderer: 'svg',
          loop: true,
          autoplay: true
        });
      });
    }
  }
}
