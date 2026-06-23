package com.app.chatims.service.impl;

import com.app.chatims.dto.DataExportDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.dto.UpdateContactsRequest;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.entity.UserPhotoEntity;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserPhotoRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.KeycloakAdminService;
import com.app.chatims.service.UserService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;
import com.app.chatims.util.Gender;
import com.app.chatims.util.GeoUtils;
import com.app.chatims.util.ImageValidator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private static final int MAX_PHOTOS = 3;

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final UserPhotoRepository userPhotoRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public UserEntity completeUserProfile(
            String keycloakId,
            String name,
            Integer age,
            Gender gender,
            MultipartFile photo
    ) throws IOException {
        if (userRepository.findByKeycloakId(keycloakId).isPresent()) {
            throw new IllegalStateException("Profile already exists for keycloakId: " + keycloakId);
        }
        UserEntity user = new UserEntity();
        user.setName(name);
        user.setAge(age);
        user.setGender(gender);
        user.setKeycloakId(keycloakId);
        String path = savePhoto(photo);
        user.setPhotoPath(path);
        UserEntity saved = userRepository.save(user);
        if (path != null) {
            UserPhotoEntity entry = new UserPhotoEntity();
            entry.setUserId(saved.getUserId());
            entry.setPosition(0);
            entry.setPhotoPath(path);
            userPhotoRepository.save(entry);
        }
        return saved;
    }

    @Override
    public UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
    }

    @Override
    public UserEntity getUserByKeycloakId(String keycloakId) {
        return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found for keycloakId: " + keycloakId));
    }

    @Override
    @Transactional
    public UserEntity updateContacts(String keycloakId, UpdateContactsRequest request) {
        UserEntity user = getUserByKeycloakId(keycloakId);
        user.setWhatsappNumber(blankToNull(request.whatsappNumber()));
        user.setTelegramHandle(blankToNull(request.telegramHandle()));
        user.setViberNumber(blankToNull(request.viberNumber()));
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public UserEntity updatePreferences(String keycloakId, MatchPreferencesDto prefs) {
        if (prefs.minAge() > prefs.maxAge()) {
            throw new IllegalArgumentException("minAge must be <= maxAge");
        }
        UserEntity user = getUserByKeycloakId(keycloakId);
        user.setPreferredGender(prefs.preferredGender());
        user.setMinAge(prefs.minAge());
        user.setMaxAge(prefs.maxAge());
        user.setIntent(prefs.intent());
        user.setPreferencesSet(true);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public UserEntity replacePhoto(String keycloakId, MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Photo is required.");
        }
        UserEntity user = getUserByKeycloakId(keycloakId);
        String path = savePhoto(photo);
        user.setPhotoPath(path);
        userRepository.save(user);
        userPhotoRepository.findByUserIdAndPosition(user.getUserId(), 0)
                .ifPresentOrElse(
                        existing -> {
                            deletePhotoFile(existing.getPhotoPath());
                            existing.setPhotoPath(path);
                            userPhotoRepository.save(existing);
                        },
                        () -> {
                            UserPhotoEntity entry = new UserPhotoEntity();
                            entry.setUserId(user.getUserId());
                            entry.setPosition(0);
                            entry.setPhotoPath(path);
                            userPhotoRepository.save(entry);
                        }
                );
        return user;
    }

    @Override
    @Transactional
    public UserEntity updateLocation(String keycloakId, Double latitude, Double longitude, Integer maxDistanceKm) {
        UserEntity user = getUserByKeycloakId(keycloakId);
        if (latitude != null && longitude != null) {
            double[] quantized = GeoUtils.quantizeLocation(latitude, longitude);
            user.setLatitude(quantized[0]);
            user.setLongitude(quantized[1]);
        } else {
            user.setLatitude(null);
            user.setLongitude(null);
        }
        user.setMaxDistanceKm(maxDistanceKm);
        return userRepository.save(user);
    }

    @Override
    public DataExportDto exportUserData(String keycloakId) {
        UserEntity user = getUserByKeycloakId(keycloakId);
        List<ChatEntity> mutualChats = chatRepository.findMutualMatchesForUser(user.getUserId());
        List<DataExportDto.MatchSummary> matches = mutualChats.stream()
                .map(c -> {
                    Long partnerId = c.otherParticipant(user.getUserId());
                    UserEntity partner = userRepository.findById(partnerId).orElse(null);
                    if (partner == null) return null;
                    return new DataExportDto.MatchSummary(
                            c.getChatId(),
                            c.getStartedAt(),
                            partner.getName(),
                            partner.getAge(),
                            partner.getWhatsappNumber(),
                            partner.getTelegramHandle(),
                            partner.getViberNumber()
                    );
                })
                .filter(m -> m != null)
                .toList();
        return new DataExportDto(LocalDateTime.now(ZoneOffset.UTC), DataExportDto.Profile.from(user), matches);
    }

    @Override
    @Transactional
    public void deleteAccount(String keycloakId) {
        UserEntity user = getUserByKeycloakId(keycloakId);
        String photoPath = user.getPhotoPath();
        userRepository.delete(user);
        deletePhotoFile(photoPath);
        try {
            keycloakAdminService.deleteUser(keycloakId);
        } catch (Exception e) {
            log.error("Failed to delete Keycloak user {} after DB deletion: {}", keycloakId, e.getMessage());
            throw e;
        }
        log.info("Account deleted: userId={}, keycloakId={}", user.getUserId(), keycloakId);
    }

    @Override
    public List<String> getPhotosFor(Long userId) {
        return userPhotoRepository.findByUserIdOrderByPositionAsc(userId)
                .stream().map(UserPhotoEntity::getPhotoPath).toList();
    }

    @Override
    @Transactional
    public UserEntity addPhoto(String keycloakId, MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Photo is required.");
        }
        UserEntity user = getUserByKeycloakId(keycloakId);
        List<UserPhotoEntity> existing = userPhotoRepository.findByUserIdOrderByPositionAsc(user.getUserId());
        if (existing.size() >= MAX_PHOTOS) {
            throw new IllegalStateException("Maximum " + MAX_PHOTOS + " photos allowed.");
        }
        int nextPos = nextAvailablePosition(existing);
        String path = savePhoto(photo);
        UserPhotoEntity entry = new UserPhotoEntity();
        entry.setUserId(user.getUserId());
        entry.setPosition(nextPos);
        entry.setPhotoPath(path);
        userPhotoRepository.save(entry);
        if (nextPos == 0) {
            user.setPhotoPath(path);
            userRepository.save(user);
        }
        return user;
    }

    @Override
    @Transactional
    public UserEntity removePhotoAt(String keycloakId, Integer position) {
        UserEntity user = getUserByKeycloakId(keycloakId);
        userPhotoRepository.findByUserIdAndPosition(user.getUserId(), position)
                .ifPresent(p -> {
                    deletePhotoFile(p.getPhotoPath());
                    userPhotoRepository.delete(p);
                });
        if (position == 0) {
            List<UserPhotoEntity> remaining = userPhotoRepository.findByUserIdOrderByPositionAsc(user.getUserId());
            user.setPhotoPath(remaining.isEmpty() ? null : remaining.get(0).getPhotoPath());
            userRepository.save(user);
        }
        return user;
    }

    @Override
    @Transactional
    public void removeMatch(String keycloakId, Long partnerId) {
        UserEntity me = getUserByKeycloakId(keycloakId);
        if (partnerId == null || partnerId.equals(me.getUserId())) {
            throw new IllegalArgumentException("Invalid partner.");
        }
        List<ChatEntity> mutual = chatRepository.findMutualMatchBetween(me.getUserId(), partnerId);
        if (mutual.isEmpty()) {
            throw new IllegalStateException("No active match with this user.");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        mutual.forEach(c -> {
            c.setMatchRemovedAt(now);
            chatRepository.save(c);
        });
        userRepository.findById(partnerId).ifPresent(partner ->
                messagingTemplate.convertAndSendToUser(
                        partner.getKeycloakId(),
                        "/queue/match-removed",
                        Map.of("partnerId", me.getUserId())
                )
        );
        log.info("Match removed: user={} unmatched partner={}", me.getUserId(), partnerId);
    }

    @Override
    @Transactional
    public UserEntity updateTheme(String keycloakId, String theme) {
        if (theme == null || (!theme.equals("dark") && !theme.equals("light"))) {
            throw new IllegalArgumentException("Theme must be 'dark' or 'light'.");
        }
        UserEntity user = getUserByKeycloakId(keycloakId);
        user.setTheme(theme);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public UserEntity updateLanguages(String keycloakId, List<String> languages) {
        UserEntity user = getUserByKeycloakId(keycloakId);
        if (languages == null || languages.isEmpty()) {
            user.setLanguages(null);
        } else {
            user.setLanguages(String.join(",", languages));
        }
        return userRepository.save(user);
    }

    private int nextAvailablePosition(List<UserPhotoEntity> existing) {
        boolean[] used = new boolean[MAX_PHOTOS];
        for (UserPhotoEntity p : existing) {
            if (p.getPosition() >= 0 && p.getPosition() < MAX_PHOTOS) used[p.getPosition()] = true;
        }
        for (int i = 0; i < MAX_PHOTOS; i++) if (!used[i]) return i;
        throw new IllegalStateException("No free photo slot.");
    }

    private void deletePhotoFile(String photoPath) {
        if (photoPath == null || !photoPath.startsWith("/uploads/")) return;
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path target = dir.resolve(photoPath.substring("/uploads/".length())).normalize();
            if (target.startsWith(dir)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException e) {
            log.warn("Could not delete photo file {}: {}", photoPath, e.getMessage());
        }
    }

    private String savePhoto(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) return null;
        ImageValidator.ImageType type = ImageValidator.validate(photo);
        String filename = UUID.randomUUID() + ImageValidator.extensionFor(type);
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(filename).normalize();
        if (!target.startsWith(dir)) {
            throw new IOException("Invalid upload path.");
        }
        Files.copy(photo.getInputStream(), target);
        log.debug("Saved photo to {}", target);
        return "/uploads/" + filename;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
