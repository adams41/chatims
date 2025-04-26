import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatPreferencesComponent } from './chat-preferences.component';

describe('ChatPreferencesComponent', () => {
  let component: ChatPreferencesComponent;
  let fixture: ComponentFixture<ChatPreferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatPreferencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
