import { CommonModule } from '@angular/common';
import { Component} from '@angular/core'; 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,  
    MatButtonModule,
    MatIconModule
  ],
  styleUrl: './app.component.css'
})
export class AppComponent  {

  isDarkMode = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }
 
}

