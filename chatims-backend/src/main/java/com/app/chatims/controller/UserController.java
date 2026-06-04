package com.app.chatims.controller;

import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.dto.RevealedProfileDto;
import com.app.chatims.dto.UpdateContactsRequest;
import com.app.chatims.dto.UpdateLocationRequest;
import com.app.chatims.dto.UserProfileDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.UserService;
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

    private final UserService userService;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> me(Authentication auth) {
        UserEntity user = AuthUtils.currentUser(auth, userRepository);
        return ResponseEntity.ok(UserProfileDto.from(user));
    }

    @GetMapping("/keycloak/{sub}")
    public ResponseEntity<UserProfileDto> getByKeycloak(@PathVariable String sub) {
        UserEntity user = userService.getUserByKeycloakId(sub);
        return ResponseEntity.ok(UserProfileDto.from(user));
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
        List<RevealedProfileDto> matches = mutualChats.stream()
                .map(c -> c.otherParticipant(me.getUserId()))
                .distinct()
                .map(otherId -> userRepository.findById(otherId).orElse(null))
                .filter(u -> u != null)
                .map(RevealedProfileDto::from)
                .toList();
        return ResponseEntity.ok(matches);
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
        return ResponseEntity.ok(UserProfileDto.from(user));
    }

    private String validateProfileInputs(Integer age, String gender) {
        if (age == null || age < 18 || age > 120) return "Age must be between 18 and 120.";
        if (gender == null || gender.isBlank()) return "Gender is required.";
        return null;
    }
}
