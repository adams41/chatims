import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';


export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  gender: string;
  photoPath: string;
}

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

  getUserData(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
        tap((user) => {
          
            this.userName = user.name;
            this.userAge = user.age;
            this.userPhoto = user.photoPath;
        })
    );
  }
  
  setUserPhoto(photoUrl: string): void {
    this.userPhoto = photoUrl;
  }
  
  getUserPhoto(): string | null {
    return this.userPhoto;
  }


}
