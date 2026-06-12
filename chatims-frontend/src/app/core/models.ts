export type Gender = 'MALE' | 'FEMALE';
export type ChatStatus = 'ACTIVE' | 'ENDED';
export type Intent = 'FRIENDSHIP' | 'DATING' | 'JUST_CHAT' | 'NETWORKING';

export const INTENT_LABELS: Record<Intent, string> = {
  FRIENDSHIP: 'Friendship',
  DATING: 'Dating',
  JUST_CHAT: 'Just chat',
  NETWORKING: 'Networking',
};

export interface UserProfile {
  id: number;
  keycloakId: string;
  name: string;
  email: string | null;
  age: number;
  gender: Gender;
  photoPath: string | null;
  photos: string[];
  preferencesSet: boolean;
  whatsappNumber: string | null;
  telegramHandle: string | null;
  viberNumber: string | null;
  preferredGender: Gender | null;
  minAge: number | null;
  maxAge: number | null;
  intent: Intent | null;
  theme: 'dark' | 'light' | null;
  hasContact: boolean;
  latitude?: number | null;
  longitude?: number | null;
  languages?: string[];
  maxDistanceKm?: number | null;
}

export interface UpdateLocationRequest {
  latitude: number | null;
  longitude: number | null;
  maxDistanceKm: number | null;
}

export interface AnonymousPartner {
  userId: number;
  displayName: string;
  age: number;
  gender: Gender;
  intent: Intent | null;
}

export interface ChatSession {
  chatId: number;
  partner: AnonymousPartner;
  status: ChatStatus;
  startedAt: string;
  endsAt: string;
  remainingSeconds: number;
  youLiked: boolean;
  partnerLiked: boolean;
  mutualMatch: boolean;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  sendTimestamp: string;
}

export interface RevealedProfile {
  userId: number;
  name: string;
  age: number;
  gender: Gender;
  photoPath: string | null;
  photos: string[];
  intent: Intent | null;
  whatsappNumber: string | null;
  telegramHandle: string | null;
  viberNumber: string | null;
  youSharedContacts: boolean;
  partnerSharedContacts: boolean;
  contactsRevealed: boolean;
}

export interface MatchPreferences {
  preferredGender: Gender | null;
  minAge: number;
  maxAge: number;
  intent: Intent | null;
}

export interface UpdateContactsRequest {
  whatsappNumber: string | null;
  telegramHandle: string | null;
  viberNumber: string | null;
}
