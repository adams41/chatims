package com.app.chatims.controller;

import com.app.chatims.dto.AuthLoginRequest;
import com.app.chatims.dto.AuthRegisterRequest;
import com.app.chatims.entity.InviteCodeEntity;
import com.app.chatims.repository.InviteCodeRepository;
import com.app.chatims.service.KeycloakAdminService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE = "chatims_refresh";
    private static final String COOKIE_PATH = "/auth";
    private static final int REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

    private final KeycloakAdminService keycloakAdmin;
    private final InviteCodeRepository inviteCodeRepository;

    @Value("${chatims.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${chatims.cookie.same-site:Strict}")
    private String cookieSameSite;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRegisterRequest req) {
        String code = req.inviteCode().trim().toUpperCase();
        Optional<InviteCodeEntity> invite = inviteCodeRepository.findById(code);
        if (invite.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Invalid invite code."));
        }
        if (invite.get().getUsedAt() != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "This invite code has already been used."));
        }
        if (invite.get().getExpiresAt() != null && invite.get().getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "This invite code has expired."));
        }
        try {
            keycloakAdmin.createUser(req.name(), req.email(), req.password());
            InviteCodeEntity entry = invite.get();
            entry.setUsedAt(LocalDateTime.now(ZoneOffset.UTC));
            inviteCodeRepository.save(entry);
            return ResponseEntity.ok(Map.of("message", "Account created. You can now sign in."));
        } catch (IllegalStateException e) {
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthLoginRequest req, HttpServletResponse response) {
        try {
            JsonNode tokens = keycloakAdmin.login(req.username(), req.password());
            if (tokens == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials."));
            }
            String refreshToken = tokens.path("refresh_token").asText("");
            if (refreshToken.isEmpty()) {
                log.error("Keycloak login succeeded but returned no refresh_token");
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("message", "Login failed. Please try again."));
            }
            setRefreshCookie(response, refreshToken);
            return ResponseEntity.ok(Map.of(
                    "accessToken", tokens.path("access_token").asText(""),
                    "expiresIn",   tokens.path("expires_in").asInt(300)
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

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readRefreshCookie(request);
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No refresh token. Please sign in."));
        }
        try {
            JsonNode tokens = keycloakAdmin.refresh(refreshToken);
            if (tokens == null || tokens.has("error")) {
                clearRefreshCookie(response);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Refresh token expired. Please sign in again."));
            }
            String newRefreshToken = tokens.path("refresh_token").asText("");
            if (newRefreshToken.isEmpty()) {
                clearRefreshCookie(response);
                log.error("Keycloak refresh succeeded but returned no refresh_token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Session expired. Please sign in again."));
            }
            setRefreshCookie(response, newRefreshToken);
            return ResponseEntity.ok(Map.of(
                    "accessToken", tokens.path("access_token").asText(""),
                    "expiresIn",   tokens.path("expires_in").asInt(300)
            ));
        } catch (Exception e) {
            clearRefreshCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Session expired. Please sign in again."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearRefreshCookie(response);
        return ResponseEntity.ok(Map.of("message", "Logged out."));
    }

    private void setRefreshCookie(HttpServletResponse response, String value) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(REFRESH_COOKIE_MAX_AGE);
        cookie.setAttribute("SameSite", cookieSameSite);
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", cookieSameSite);
        response.addCookie(cookie);
    }

    private String readRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (REFRESH_COOKIE.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
