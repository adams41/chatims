import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { KeycloakService } from '../services/keycloak.service';
import { AuthApiService } from '../services/auth-api.service';

export const keycloakHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(KeycloakService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  const addToken = (r: typeof req) => {
    const token = keycloak.getToken();
    return token
      ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : r;
  };

  return next(addToken(req)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const refreshToken = keycloak.getRefreshToken();
        if (refreshToken) {
          return authApi.refresh(refreshToken).pipe(
            switchMap(tokens => {
              keycloak.storeTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
              return next(addToken(req));
            }),
            catchError(() => {
              keycloak.clearTokens();
              router.navigate(['/']);
              return throwError(() => err);
            })
          );
        }
        keycloak.clearTokens();
        router.navigate(['/']);
      }
      return throwError(() => err);
    })
  );
};
