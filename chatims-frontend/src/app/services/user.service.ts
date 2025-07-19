import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserEntity } from '../model/user-entity.model';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userName: string | null = null;
  private userAge: number | null = null;
  private userPhoto: string | null = null;
  private userId: number | null = null;

  private apiUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  getUserData(id: number): Observable<UserEntity> {
    return this.http.get<UserEntity>(`${this.apiUrl}/users/${id}`);
  }

  getUserByKeycloakId(keycloakId: string): Observable<UserEntity> {
    return this.http.get<UserEntity>(`${this.apiUrl}/users/keycloak/${keycloakId}`, {
      headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
}

  setUserName(name: string): void {
    this.userName = name;
  }

  setUserAge(age: number): void {
    this.userAge = age;
  }

  setUserPhoto(photo: string): void {
    this.userPhoto = photo;
  }

  getUserName(): string | null {
    return this.userName;
  }

  getUserAge(): number | null {
    return this.userAge;
  }

  getUserId(): number | null {
    return this.userId;
  }

  setUserId(id: number): void {
    this.userId = id;
  }

  getUserPhoto(): string | null {
    return this.userPhoto;
  }
}
