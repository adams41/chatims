import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userName: string | null = null;
  private userAge: number | null = null;

  private apiUrl = 'http://localhost:8080/users';

  constructor(private http: HttpClient) {}

  // Устанавливаем имя пользователя
  setUserName(name: string): void {
    this.userName = name;
  }

  // Получаем имя пользователя
  getUserName(): string | null {
    return this.userName;
  }

  // Устанавливаем возраст пользователя
  setUserAge(age: number): void {
    this.userAge = age;
  }

  // Получаем возраст пользователя
  getUserAge(): number | null {
    return this.userAge;
  }

  // Получение данных пользователя по id
  getUserData(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }
}
