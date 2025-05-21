import { CommonModule } from '@angular/common';
import { Component, OnInit} from '@angular/core'; 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html',
  imports: [
    CommonModule,
    RouterModule,  
    MatButtonModule,
    MatIconModule
  ],
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  isDarkMode = false;

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);

    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }
}

