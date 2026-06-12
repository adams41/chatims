import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Gender, Intent, MatchPreferences } from '../../core/models';
import { UserApiService } from '../../core/services/user-api.service';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

interface Question {
  text: string;
  key: 'ageRange' | 'gender' | 'intent';
  options?: string[];
}

@Component({
  selector: 'app-chat-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './chat-preferences.component.html',
  styleUrls: ['./chat-preferences.component.css'],
})
export class ChatPreferencesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly users = inject(UserApiService);

  @Input() embedded = false;
  @Output() savedPrefs = new EventEmitter<MatchPreferences>();

  questions: Question[] = [
    { key: 'ageRange', text: 'What age range are you looking for?' },
    { key: 'gender', text: 'What gender should your chat partner be?', options: ['Male', 'Female', "Doesn't matter"] },
    { key: 'intent', text: 'What are you looking for?', options: ['Friendship', 'Dating', 'Just chat', 'Networking'] },
  ];

  currentQuestionIndex = 0;
  answers: Record<string, string> = {};
  saving = false;
  error: string | null = null;

  minAge = signal<number>(18);
  maxAge = signal<number>(60);

  ngOnInit(): void {
    this.users.me().subscribe({
      next: profile => {
        this.minAge.set(profile.minAge ?? 18);
        this.maxAge.set(profile.maxAge ?? 60);
        if (profile.preferredGender === 'MALE') this.answers['gender'] = 'Male';
        else if (profile.preferredGender === 'FEMALE') this.answers['gender'] = 'Female';
        else this.answers['gender'] = "Doesn't matter";
      },
      error: () => {},
    });
  }

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
    this.advance();
  }

  confirmAgeRange(): void {
    this.answers['ageRange'] = `${this.minAge()}-${this.maxAge()}`;
    this.advance();
  }

  onMinAgeChange(value: string): void {
    const n = Math.max(18, Math.min(99, Number(value) || 18));
    if (n > this.maxAge()) this.maxAge.set(n);
    this.minAge.set(n);
  }

  onMaxAgeChange(value: string): void {
    const n = Math.max(18, Math.min(99, Number(value) || 99));
    if (n < this.minAge()) this.minAge.set(n);
    this.maxAge.set(n);
  }

  private advance(): void {
    this.currentQuestionIndex++;
    if (this.isDone) {
      this.saveAndNavigate();
    }
  }

  private buildPrefs(): MatchPreferences {
    const gender = this.answers['gender'] ?? "Doesn't matter";
    let preferredGender: Gender | null = null;
    if (gender === 'Male') preferredGender = 'MALE';
    else if (gender === 'Female') preferredGender = 'FEMALE';
    return {
      preferredGender,
      minAge: this.minAge(),
      maxAge: this.maxAge(),
      intent: this.intentFromLabel(this.answers['intent']),
    };
  }

  private intentFromLabel(label: string | undefined): Intent | null {
    switch (label) {
      case 'Friendship': return 'FRIENDSHIP';
      case 'Dating': return 'DATING';
      case 'Just chat': return 'JUST_CHAT';
      case 'Networking': return 'NETWORKING';
      default: return null;
    }
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
          this.router.navigate(['/profile']);
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
