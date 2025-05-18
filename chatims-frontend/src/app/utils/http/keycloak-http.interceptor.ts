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
          Authorization: `Bearer ${token}`
        })
      });
      console.log('Sending request with auth header');
      return next(authReq);
    }
  } else {
    console.warn('Token is invalid or expired');
  }
  console.log('Sending request with auth header');
  return next(req);
};
