package com.app.chatims.util;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

public final class AuthUtils {

    private AuthUtils() {}

    public static String keycloakIdOf(Authentication auth) {
        if (auth == null) throw new IllegalStateException("No authentication");
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        throw new IllegalStateException("Unsupported principal: " + principal);
    }

    public static UserEntity currentUser(Authentication auth, UserRepository userRepository) {
        String kid = keycloakIdOf(auth);
        return userRepository.findByKeycloakId(kid)
                .orElseThrow(() -> new UserNotFoundException("User not found for keycloakId: " + kid));
    }
}
