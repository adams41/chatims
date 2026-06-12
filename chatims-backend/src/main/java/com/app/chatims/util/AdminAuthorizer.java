package com.app.chatims.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class AdminAuthorizer {

    private final Set<String> adminKeycloakIds;

    public AdminAuthorizer(@Value("${chatims.admin.keycloak-ids:}") String csv) {
        this.adminKeycloakIds = csv == null || csv.isBlank()
                ? Set.of()
                : Set.of(csv.split("\\s*,\\s*"));
    }

    public void requireAdmin(Authentication auth) {
        String sub = AuthUtils.keycloakIdOf(auth);
        if (!adminKeycloakIds.contains(sub)) {
            throw new AccessDeniedException("Admin only.");
        }
    }
}
