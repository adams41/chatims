import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.css',
})
export class ImpressumComponent implements OnInit {
  private readonly http = inject(HttpClient);
  content = signal<string>('');

  ngOnInit(): void {
    this.http.get('/legal/impressum.md', { responseType: 'text' }).subscribe(md => {
      this.content.set(marked(md) as string);
    });
  }
}
