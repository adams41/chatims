package com.app.chatims.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpMethod;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url}")
    private String keycloakUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.admin-user:admin}")
    private String adminUser;

    @Value("${keycloak.admin-password:admin}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    /** Proxy token refresh to Keycloak. */
    public JsonNode refresh(String refreshToken) {
        String url = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("refresh_token", refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        return restTemplate.postForObject(url, new HttpEntity<>(body, headers), JsonNode.class);
    }

    /** Proxy ROPC login to Keycloak — returns the raw token JSON from Keycloak. */
    public JsonNode login(String username, String password) {
        String url = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("username", username);
        body.add("password", password);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        return restTemplate.postForObject(url, new HttpEntity<>(body, headers), JsonNode.class);
    }

    /** Create a new user in Keycloak. Throws if user already exists or creation fails. */
    public void createUser(String name, String email, String password) {
        String adminToken = getAdminToken();

        String url = keycloakUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> userRep = Map.of(
                "username", email,
                "email", email,
                "firstName", name,
                "enabled", true,
                "emailVerified", true,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", false
                ))
        );

        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(url, new HttpEntity<>(userRep, headers), Void.class);
            log.info("Keycloak user created, status={}", response.getStatusCode());
        } catch (HttpClientErrorException.Conflict e) {
            throw new IllegalStateException("An account with this email already exists.");
        } catch (HttpClientErrorException e) {
            log.error("Keycloak user creation failed: {}", e.getResponseBodyAsString());
            throw new IllegalStateException("Registration failed: " + e.getStatusCode());
        }
    }

    public void deleteUser(String keycloakId) {
        String adminToken = getAdminToken();
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
            log.info("Keycloak user deleted: keycloakId={}", keycloakId);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Keycloak user not found on delete: keycloakId={}", keycloakId);
        } catch (HttpClientErrorException e) {
            log.error("Keycloak user deletion failed: {}", e.getResponseBodyAsString());
            throw new IllegalStateException("Failed to delete user from Keycloak.");
        }
    }

    private String getAdminToken() {
        String url = keycloakUrl + "/realms/master/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", adminUser);
        body.add("password", adminPassword);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        JsonNode resp = restTemplate.postForObject(url, new HttpEntity<>(body, headers), JsonNode.class);
        if (resp == null || !resp.has("access_token")) {
            throw new IllegalStateException("Could not authenticate as Keycloak admin.");
        }
        return resp.get("access_token").asText();
    }
}
