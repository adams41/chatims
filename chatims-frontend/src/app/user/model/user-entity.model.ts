export interface UserEntity {
    id: number;
    name: string;
    email: string;
    age: number;
    gender: string;
    photoPath: string;
    keycloakId: string;
    preferencesSet: boolean;
  }