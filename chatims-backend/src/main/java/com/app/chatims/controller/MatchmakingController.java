package com.app.chatims.controller;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.service.MatchmakingService;
import com.app.chatims.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/matchmaking")
@RequiredArgsConstructor
public class MatchmakingController {

    private final MatchmakingService matchmakingService;

    @PostMapping("/find")
    public ResponseEntity<?> findMatch(Authentication auth, @Valid @RequestBody MatchPreferencesDto prefs) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        try {
            ChatSessionDto session = matchmakingService.findOrCreateChat(keycloakId, prefs);
            return ResponseEntity.ok(session);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during matchmaking for keycloakId={}", keycloakId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Matchmaking failed unexpectedly"));
        }
    }

    @DeleteMapping("/queue")
    public ResponseEntity<Void> leaveQueue(Authentication auth) {
        matchmakingService.leaveQueue(AuthUtils.keycloakIdOf(auth));
        return ResponseEntity.noContent().build();
    }
}
