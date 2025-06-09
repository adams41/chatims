import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() name: string | null = null;
  @Input() age: number | null = null;
  @Input() photo: string | null = null;

  @Output() profileClick = new EventEmitter<void>();

  onProfileClick(): void {
    this.profileClick.emit();
  }
}
