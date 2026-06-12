package com.app.chatims.controller;

import com.app.chatims.entity.InviteCodeEntity;
import com.app.chatims.repository.InviteCodeRepository;
import com.app.chatims.util.AdminAuthorizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/invites")
@RequiredArgsConstructor
public class AdminInviteController {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LEN = 6;
    private static final int MAX_BATCH = 50;
    private static final SecureRandom RNG = new SecureRandom();

    private final InviteCodeRepository repo;
    private final AdminAuthorizer admin;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth) {
        admin.requireAdmin(auth);
        List<Map<String, Object>> rows = repo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(i -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("code", i.getCode());
                    m.put("note", i.getNote());
                    m.put("createdAt", i.getCreatedAt());
                    m.put("usedAt", i.getUsedAt());
                    m.put("usedByUserId", i.getUsedByUserId());
                    m.put("expiresAt", i.getExpiresAt());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping
    public ResponseEntity<?> generate(Authentication auth, @RequestBody Map<String, Object> body) {
        admin.requireAdmin(auth);
        int count = body.get("count") instanceof Number n ? n.intValue() : 1;
        if (count < 1 || count > MAX_BATCH) {
            return ResponseEntity.badRequest().body(Map.of("message", "count must be 1.." + MAX_BATCH));
        }
        String note = body.get("note") instanceof String s && !s.isBlank() ? s.trim() : null;
        Integer expiresInDays = body.get("expiresInDays") instanceof Number n ? n.intValue() : null;
        if (expiresInDays != null && (expiresInDays < 1 || expiresInDays > 365)) {
            return ResponseEntity.badRequest().body(Map.of("message", "expiresInDays must be 1..365"));
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = expiresInDays != null ? now.plusDays(expiresInDays) : null;

        List<String> generated = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            String code;
            int attempts = 0;
            do {
                code = "CHAT-" + randomCode();
                attempts++;
                if (attempts > 10) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Could not generate unique code, try again."));
                }
            } while (repo.existsById(code));

            InviteCodeEntity entry = new InviteCodeEntity();
            entry.setCode(code);
            entry.setNote(note);
            entry.setCreatedAt(now);
            entry.setExpiresAt(expiresAt);
            repo.save(entry);
            generated.add(code);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("codes", generated));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<?> revoke(Authentication auth, @PathVariable String code) {
        admin.requireAdmin(auth);
        return repo.findById(code.toUpperCase())
                .map(entry -> {
                    if (entry.getUsedAt() != null) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body((Object) Map.of("message", "Cannot revoke a used code."));
                    }
                    repo.delete(entry);
                    return ResponseEntity.noContent().<Object>build();
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Code not found.")));
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LEN);
        for (int i = 0; i < CODE_LEN; i++) sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
