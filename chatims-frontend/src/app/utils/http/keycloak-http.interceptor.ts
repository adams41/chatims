import { inject } from "@angular/core";
import { KeycloakService } from "../keycloak/keycloak.service";
import { HttpHeaders, HttpInterceptorFn } from "@angular/common/http";

export const keycloakHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);

  if (keycloakService.isTokenValid) {
    const token = keycloakService.getToken();

    if (token) {
      const authReq = req.clone({
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        })
      });

      console.log('[Interceptor] Token found, adding Authorization header');
      return next(authReq);
    } else {
      console.warn('[Interceptor] Token is invalid or expired, proceeding without Authorization header');
    }
  } else {
    console.warn('[Interceptor] Keycloak token is not valid, proceeding without Authorization header');
  }

  return next(req);
};
