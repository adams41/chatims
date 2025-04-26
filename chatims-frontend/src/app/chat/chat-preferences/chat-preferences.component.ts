import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat-preferences',
  imports: [CommonModule],
  templateUrl: './chat-preferences.component.html',
  styleUrl: './chat-preferences.component.css',
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class ChatPreferencesComponent {
  questions = [
    
      {
        text: 'What age range are you looking for in a chat partner?',
        options: ['18-25', '25-35', '35-45', 'Doesn’t matter']
      },
      {
        text: 'What gender should your chat partner be?',
        options: ['Male', 'Female', 'Doesn’t matter']
      },
      {
        text: 'What are you looking for?',
        options: ['Friendship', 'Flirting', 'Serious conversation']
      }
    
    
  ];
  
  currentQuestionIndex = 0;
  currentQuestion = this.questions[this.currentQuestionIndex];
  
  preferences: any = {};
  progress = 0;

  constructor(private router: Router) {}

  nextQuestion() {
    setTimeout(() => {
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex < this.questions.length) {
        this.currentQuestion = this.questions[this.currentQuestionIndex];
      } else {
        this.startChatSearch(); 
        console.log('User answers:', this.preferences);
      }
    }, 400);
  }
  
  selectOption(option: string) {
    const currentQuestionText = this.currentQuestion?.text ?? '';
    this.preferences[currentQuestionText] = option;
    this.nextQuestion();
  }
 
  startChatSearch() {
        this.router.navigate(['/chat']); 
      }
  
  
}
 
