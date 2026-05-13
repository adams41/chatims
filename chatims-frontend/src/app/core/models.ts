export type Gender = 'MALE' | 'FEMALE';
export type ChatStatus = 'ACTIVE' | 'ENDED';

export interface UserProfile {
  id: number;
  keycloakId: string;
  name: string;
  email: string | null;
  age: number;
  gender: Gender;
  photoPath: string | null;
  preferencesSet: boolean;
  whatsappNumber: string | null;
  telegramHandle: string | null;
  viberNumber: string | null;
  preferredGender: Gender | null;
  minAge: number | null;
  maxAge: number | null;
  hasContact: boolean;
  latitude?: number | null;
  longitude?: number | null;
  maxDistanceKm?: number | null;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  maxDistanceKm: number | null;
}

export interface AnonymousPartner {
  userId: number;
  displayName: string;
  age: number;
  gender: Gender;
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
  whatsappNumber: string | null;
  telegramHandle: string | null;
  viberNumber: string | null;
}

export interface MatchPreferences {
  preferredGender: Gender | null;
  minAge: number;
  maxAge: number;
}

export interface UpdateContactsRequest {
  whatsappNumber: string | null;
  telegramHandle: string | null;
  viberNumber: string | null;
}
