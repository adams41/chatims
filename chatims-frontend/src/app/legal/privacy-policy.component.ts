import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.css',
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly http = inject(HttpClient);
  content = signal<string>('');

  ngOnInit(): void {
    this.http.get('/legal/privacy-policy.md', { responseType: 'text' }).subscribe(md => {
      this.content.set(marked(md) as string);
    });
  }
}
