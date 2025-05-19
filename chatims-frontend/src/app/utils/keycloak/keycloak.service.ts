import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private _keycloak: Keycloak | undefined;

  constructor(
    private router: Router
  ) {
  }

  getToken(): string | null {
    if (this._keycloak && this._keycloak.token) {
      return this._keycloak.token;
    }
    return null;
  }

  async init() {
    this._keycloak = new Keycloak({
      url: 'http://localhost:8080',
      realm: 'chatims-app',
      clientId: 'chatims-client',
    });

    return this._keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
    });
  }

  async login(): Promise<void> {
    if (!this._keycloak) {
      throw new Error('Keycloak is not initialized. Call init() first.');
    }

    await this._keycloak.login({
      redirectUri: window.location.origin + '/register'
    });
  }

  get userId(): string {
    return this._keycloak?.tokenParsed?.sub as string;
  }

 get isTokenValid(): boolean {
  return !!this._keycloak?.token && !this._keycloak?.isTokenExpired();
}
  get fullName(): string {
    return this._keycloak?.tokenParsed?.['name']
  }

  get email(): string | null {
    return this._keycloak?.tokenParsed?.['email'] as string || null;
  }

  logout() {
    return this._keycloak?.logout({redirectUri: 'http://localhost:4200'});
  }

  accountManagement() {
    return this._keycloak?.accountManagement();
  }

  async refreshToken(): Promise<boolean> {
    if (!this._keycloak) {
      return false;
    }

    try {
      const refreshed = await this._keycloak.updateToken(30);
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token', error);
      return false;
    }
  }
}
