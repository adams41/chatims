import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Gender, MatchPreferences } from '../../core/models';
import { UserApiService } from '../../core/services/user-api.service';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

interface Question {
  text: string;
  options: string[];
  key: 'ageRange' | 'gender' | 'intent';
}

@Component({
  selector: 'app-chat-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './chat-preferences.component.html',
  styleUrls: ['./chat-preferences.component.css'],
})
export class ChatPreferencesComponent {
  private readonly router = inject(Router);
  private readonly users = inject(UserApiService);

  @Input() embedded = false;
  @Output() savedPrefs = new EventEmitter<MatchPreferences>();

  questions: Question[] = [
    {
      key: 'ageRange',
      text: 'What age range are you looking for?',
      options: ['18–25', '25–35', '35–45', "Doesn't matter"],
    },
    {
      key: 'gender',
      text: 'What gender should your chat partner be?',
      options: ['Male', 'Female', "Doesn't matter"],
    },
    {
      key: 'intent',
      text: 'What are you looking for?',
      options: ['Friendship', 'Flirting', 'Serious conversation'],
    },
  ];

  currentQuestionIndex = 0;
  answers: Record<string, string> = {};
  saving = false;
  error: string | null = null;

  get currentQuestion(): Question | undefined {
    return this.questions[this.currentQuestionIndex];
  }

  get progress(): number {
    return Math.round((this.currentQuestionIndex / this.questions.length) * 100);
  }

  get isDone(): boolean {
    return this.currentQuestionIndex >= this.questions.length;
  }

  selectOption(option: string): void {
    const q = this.currentQuestion;
    if (!q) return;
    this.answers[q.key] = option;
    this.currentQuestionIndex++;
    if (this.isDone) {
      this.saveAndNavigate();
    }
  }

  private buildPrefs(): MatchPreferences {
    const ageRange = this.answers['ageRange'] ?? "Doesn't matter";
    const gender = this.answers['gender'] ?? "Doesn't matter";
    let minAge = 18;
    let maxAge = 99;
    if (ageRange === '18–25') { minAge = 18; maxAge = 25; }
    else if (ageRange === '25–35') { minAge = 25; maxAge = 35; }
    else if (ageRange === '35–45') { minAge = 35; maxAge = 45; }
    let preferredGender: Gender | null = null;
    if (gender === 'Male') preferredGender = 'MALE';
    else if (gender === 'Female') preferredGender = 'FEMALE';
    return { preferredGender, minAge, maxAge };
  }

  private saveAndNavigate(): void {
    this.saving = true;
    this.error = null;
    const prefs = this.buildPrefs();

    this.users.updatePreferences(prefs).subscribe({
      next: () => {
        if (this.embedded) {
          this.savedPrefs.emit(prefs);
          this.saving = false;
        } else {
          this.router.navigate(['/matchmaking']);
        }
      },
      error: err => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to save preferences. Try again.';
      },
    });
  }

  reset(): void {
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.saving = false;
    this.error = null;
  }
}
