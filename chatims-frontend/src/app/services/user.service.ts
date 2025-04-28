import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userName: string | null = null;
  private userAge: number | null = null;
  private userPhoto: string | null = null;

  private apiUrl = 'http://localhost:8080/users';

  constructor(private http: HttpClient) {}

  setUserName(name: string): void {
    this.userName = name;
  }

  getUserName(): string | null {
    return this.userName;
  } 
  setUserAge(age: number): void {
    this.userAge = age;
  } 

  getUserAge(): number | null {
    return this.userAge;
  }

  getUserData(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }

  setUserPhoto(photoUrl: string): void {
    this.userPhoto = photoUrl;
  }
  
  getUserPhoto(): string | null {
    return this.userPhoto;
  }

}
