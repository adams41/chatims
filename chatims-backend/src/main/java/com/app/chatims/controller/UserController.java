package com.app.chatims.controller;

import com.app.chatims.dto.DataExportDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.dto.RevealedProfileDto;
import com.app.chatims.dto.UpdateContactsRequest;
import com.app.chatims.dto.UpdateLocationRequest;
import com.app.chatims.dto.UserProfileDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.entity.UserReportEntity;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserReportRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.UserService;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Set;
import com.app.chatims.util.AuthUtils;
import com.app.chatims.util.Gender;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private static final Set<String> REPORT_REASONS =
            Set.of("inappropriate", "harassment", "spam", "underage", "fake_profile", "other");

    private final UserService userService;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final UserReportRepository reportRepository;
    private final com.app.chatims.util.AdminAuthorizer adminAuthorizer;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> me(Authentication auth) {
        UserEntity user = AuthUtils.currentUser(auth, userRepository);
        return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
    }

    @GetMapping("/me/admin-status")
    public ResponseEntity<Map<String, Boolean>> adminStatus(Authentication auth) {
        boolean isAdmin;
        try {
            adminAuthorizer.requireAdmin(auth);
            isAdmin = true;
        } catch (Exception e) {
            isAdmin = false;
        }
        return ResponseEntity.ok(Map.of("admin", isAdmin));
    }

    @GetMapping("/keycloak/{sub}")
    public ResponseEntity<UserProfileDto> getByKeycloak(@PathVariable String sub) {
        UserEntity user = userService.getUserByKeycloakId(sub);
        return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
    }

    @PostMapping("/complete-profile")
    public ResponseEntity<?> completeProfile(
            Authentication auth,
            @RequestParam("name") String name,
            @RequestParam("age") Integer age,
            @RequestParam("gender") String gender,
            @RequestParam("photo") MultipartFile photo
    ) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);

        String validationError = validateProfileInputs(age, gender);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", validationError));
        }

        try {
            Gender g = Gender.valueOf(gender.toUpperCase());
            UserEntity user = userService.completeUserProfile(keycloakId, name, age, g, photo);
            return ResponseEntity.ok(UserProfileDto.from(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid gender value."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save photo"));
        }
    }

    @PutMapping("/me/contacts")
    public ResponseEntity<UserProfileDto> updateContacts(
            Authentication auth,
            @Valid @RequestBody UpdateContactsRequest request
    ) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        if (!request.hasAtLeastOne()) {
            return ResponseEntity.badRequest().build();
        }
        UserEntity user = userService.updateContacts(keycloakId, request);
        return ResponseEntity.ok(UserProfileDto.from(user));
    }

    @GetMapping("/me/matches")
    public ResponseEntity<List<RevealedProfileDto>> matches(Authentication auth) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        List<ChatEntity> mutualChats = chatRepository.findMutualMatchesForUser(me.getUserId());
        java.util.Map<Long, ChatEntity> latestByPartner = new java.util.HashMap<>();
        for (ChatEntity c : mutualChats) {
            Long other = c.otherParticipant(me.getUserId());
            ChatEntity existing = latestByPartner.get(other);
            if (existing == null || c.getStartedAt().isAfter(existing.getStartedAt())) {
                latestByPartner.put(other, c);
            }
        }
        List<RevealedProfileDto> matches = latestByPartner.entrySet().stream()
                .map(e -> {
                    UserEntity u = userRepository.findById(e.getKey()).orElse(null);
                    if (u == null) return null;
                    ChatEntity c = e.getValue();
                    boolean meIsUser1 = c.getUser1Id().equals(me.getUserId());
                    boolean youShared = meIsUser1 ? c.isUser1SharedContacts() : c.isUser2SharedContacts();
                    boolean partnerShared = meIsUser1 ? c.isUser2SharedContacts() : c.isUser1SharedContacts();
                    return RevealedProfileDto.from(u, userService.getPhotosFor(u.getUserId()), youShared, partnerShared);
                })
                .filter(d -> d != null)
                .toList();
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/me/photos")
    public ResponseEntity<?> addPhoto(Authentication auth, @RequestParam("photo") MultipartFile photo) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        try {
            UserEntity user = userService.addPhoto(keycloakId, photo);
            return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to save photo."));
        }
    }

    @DeleteMapping("/me/photos/{position}")
    public ResponseEntity<UserProfileDto> removePhoto(Authentication auth, @PathVariable Integer position) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        UserEntity user = userService.removePhotoAt(keycloakId, position);
        return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
    }

    @PutMapping("/me/languages")
    public ResponseEntity<?> updateLanguages(Authentication auth, @RequestBody Map<String, Object> body) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        Object langs = body.get("languages");
        if (!(langs instanceof java.util.List<?> list)) {
            return ResponseEntity.badRequest().body(Map.of("message", "languages must be an array"));
        }
        java.util.List<String> cleaned = list.stream()
                .filter(o -> o instanceof String)
                .map(o -> ((String) o).trim())
                .filter(s -> !s.isEmpty() && s.length() <= 30)
                .distinct()
                .limit(10)
                .toList();
        UserEntity user = userService.updateLanguages(keycloakId, cleaned);
        return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
    }

    @PutMapping("/me/theme")
    public ResponseEntity<?> updateTheme(Authentication auth, @RequestBody Map<String, String> body) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        try {
            UserEntity user = userService.updateTheme(keycloakId, body.get("theme"));
            return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/me/matches/{partnerId}")
    public ResponseEntity<?> removeMatch(Authentication auth, @PathVariable Long partnerId) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        try {
            userService.removeMatch(keycloakId, partnerId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/me/photo")
    public ResponseEntity<?> replacePhoto(Authentication auth, @RequestParam("photo") MultipartFile photo) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        try {
            UserEntity user = userService.replacePhoto(keycloakId, photo);
            return ResponseEntity.ok(UserProfileDto.from(user));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save photo."));
        }
    }

    @PutMapping("/me/location")
    public ResponseEntity<UserProfileDto> updateLocation(
            Authentication auth,
            @Valid @RequestBody UpdateLocationRequest req
    ) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        UserEntity user = userService.updateLocation(keycloakId, req.latitude(), req.longitude(), req.maxDistanceKm());
        return ResponseEntity.ok(UserProfileDto.from(user));
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<UserProfileDto> updatePreferences(
            Authentication auth,
            @Valid @RequestBody MatchPreferencesDto prefs
    ) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        UserEntity user = userService.updatePreferences(keycloakId, prefs);
        return ResponseEntity.ok(UserProfileDto.from(user, userService.getPhotosFor(user.getUserId())));
    }

    @GetMapping("/me/export")
    public ResponseEntity<DataExportDto> exportData(Authentication auth) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        DataExportDto export = userService.exportUserData(keycloakId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"chatims-data-export.json\"")
                .body(export);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(Authentication auth) {
        String keycloakId = AuthUtils.keycloakIdOf(auth);
        userService.deleteAccount(keycloakId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/reports")
    public ResponseEntity<?> reportUser(Authentication auth, @RequestBody Map<String, Object> body) {
        UserEntity reporter = AuthUtils.currentUser(auth, userRepository);
        Object reportedIdRaw = body.get("reportedId");
        Object chatIdRaw = body.get("chatId");
        String reason = body.get("reason") instanceof String s ? s : null;
        String details = body.get("details") instanceof String s ? s : null;
        if (!(reportedIdRaw instanceof Number)) {
            return ResponseEntity.badRequest().body(Map.of("message", "reportedId is required."));
        }
        Long reportedId = ((Number) reportedIdRaw).longValue();
        Long chatId = chatIdRaw instanceof Number n ? n.longValue() : null;
        if (reportedId.equals(reporter.getUserId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot report yourself."));
        }
        if (reason == null || !REPORT_REASONS.contains(reason)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid reason."));
        }
        if (!userRepository.existsById(reportedId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Reported user not found."));
        }
        if (chatId != null && reportRepository.existsByReporterIdAndReportedIdAndChatId(reporter.getUserId(), reportedId, chatId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Already reported."));
        }
        UserReportEntity report = new UserReportEntity();
        report.setReporterId(reporter.getUserId());
        report.setReportedId(reportedId);
        report.setChatId(chatId);
        report.setReason(reason);
        report.setDetails(details != null && details.length() > 1000 ? details.substring(0, 1000) : details);
        report.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        reportRepository.save(report);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "reported"));
    }

    private String validateProfileInputs(Integer age, String gender) {
        if (age == null || age < 18 || age > 120) return "Age must be between 18 and 120.";
        if (gender == null || gender.isBlank()) return "Gender is required.";
        return null;
    }
}
