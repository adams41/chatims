package com.app.chatims.controller;

import com.app.chatims.dto.AuthLoginRequest;
import com.app.chatims.dto.AuthRefreshRequest;
import com.app.chatims.dto.AuthRegisterRequest;
import com.app.chatims.service.KeycloakAdminService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakAdminService keycloakAdmin;

    /** Register — create the Keycloak account. Profile setup happens separately in /users/complete-profile. */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRegisterRequest req) {
        try {
            keycloakAdmin.createUser(req.name(), req.email(), req.password());
            return ResponseEntity.ok(Map.of("message", "Account created. You can now sign in."));
        } catch (IllegalStateException e) {
            // Either "user already exists" (conflict) or upstream Keycloak misconfig.
            String msg = e.getMessage();
            HttpStatus status = msg != null && msg.toLowerCase().contains("already")
                    ? HttpStatus.CONFLICT
                    : HttpStatus.BAD_GATEWAY;
            return ResponseEntity.status(status).body(Map.of("message", msg != null ? msg : "Registration failed."));
        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("Keycloak admin auth failed — check KEYCLOAK_ADMIN_USER / KEYCLOAK_ADMIN_PASSWORD env vars", e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Server cannot authenticate with Keycloak admin. Check backend env vars."));
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Registration failed. Is Keycloak running on the configured port?"));
        }
    }

    /** Login — proxies ROPC to Keycloak, returns tokens to frontend. */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthLoginRequest req) {
        try {
            JsonNode tokens = keycloakAdmin.login(req.username(), req.password());
            if (tokens == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials."));
            }
            return ResponseEntity.ok(Map.of(
                    "accessToken",  tokens.path("access_token").asText(""),
                    "refreshToken", tokens.path("refresh_token").asText(""),
                    "expiresIn",    tokens.path("expires_in").asInt(300)
            ));
        } catch (HttpClientErrorException.Unauthorized e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        } catch (Exception e) {
            log.error("Login error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Login failed. Is Keycloak running?"));
        }
    }

    /** Refresh — exchanges a refresh token for a new access token. */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody AuthRefreshRequest req) {
        try {
            JsonNode tokens = keycloakAdmin.refresh(req.refreshToken());
            if (tokens == null || tokens.has("error")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Refresh token expired. Please sign in again."));
            }
            return ResponseEntity.ok(Map.of(
                    "accessToken",  tokens.path("access_token").asText(""),
                    "refreshToken", tokens.path("refresh_token").asText(""),
                    "expiresIn",    tokens.path("expires_in").asInt(300)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please sign in again."));
        }
    }
}
