package com.app.chatims.controller;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.service.MatchmakingService;
import com.app.chatims.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/matchmaking")
@RequiredArgsConstructor
public class MatchmakingController {

    private static final long SSE_TIMEOUT_MS = 35_000;

    private final MatchmakingService matchmakingService;
    private final TaskScheduler taskScheduler;
    private final ObjectMapper objectMapper;

    /**
     * Step 1 — join the queue. Validates profile + preferences, adds user to the queue, returns immediately.
     */
    @PostMapping("/join")
    public ResponseEntity<?> joinQueue(Authentication auth, @Valid @RequestBody MatchPreferencesDto prefs) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        try {
            matchmakingService.joinQueue(keycloakId, prefs);
            return ResponseEntity.ok(Map.of("status", "queued"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Step 2 — open an SSE stream. The backend searches for a human partner in a background thread.
     * Emits one of:
     *   event: matched,  data: {ChatSessionDto JSON}
     *   event: no_match, data: {}
     * Then closes the stream.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Authentication auth) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        taskScheduler.schedule(() -> {
            try {
                ChatSessionDto session = matchmakingService.searchForHuman(keycloakId);
                if (session != null) {
                    emitter.send(SseEmitter.event()
                            .name("matched")
                            .data(objectMapper.writeValueAsString(session), MediaType.APPLICATION_JSON));
                } else {
                    emitter.send(SseEmitter.event().name("no_match").data("{}"));
                }
                emitter.complete();
            } catch (IOException e) {
                // Client disconnected — nothing to do.
                log.debug("SSE client disconnected for keycloakId={}", keycloakId);
            } catch (IllegalStateException e) {
                // Emitter already completed (timeout fired, client aborted, etc.). Benign.
                log.debug("SSE emitter already completed for keycloakId={}", keycloakId);
            } catch (Exception e) {
                log.error("Error during SSE matchmaking for keycloakId={}", keycloakId, e);
                // Best-effort error notification — swallow any subsequent IllegalState/IO.
                try { emitter.send(SseEmitter.event().name("error").data(e.getMessage())); }
                catch (Exception ignored) {}
                try { emitter.completeWithError(e); } catch (Exception ignored) {}
            }
        }, Instant.now());

        emitter.onTimeout(() -> {
            matchmakingService.leaveQueue(keycloakId);
            emitter.complete();
        });
        emitter.onError(e -> matchmakingService.leaveQueue(keycloakId));

        return emitter;
    }

    @DeleteMapping("/queue")
    public ResponseEntity<Void> leaveQueue(Authentication auth) {
        matchmakingService.leaveQueue(AuthUtils.keycloakIdOf(auth));
        return ResponseEntity.noContent().build();
    }
}
