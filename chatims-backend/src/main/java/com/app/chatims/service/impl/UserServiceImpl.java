package com.app.chatims.service.impl;

import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.dto.UpdateContactsRequest;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.UserService;
import com.app.chatims.util.Gender;
import com.app.chatims.util.GeoUtils;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;

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
        user.setPhotoPath(savePhoto(photo));
        return userRepository.save(user);
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
        user.setPhotoPath(savePhoto(photo));
        return userRepository.save(user);
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

    private String savePhoto(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) return null;
        String filename = UUID.randomUUID() + "_" + sanitize(photo.getOriginalFilename());
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Path target = dir.resolve(filename);
        Files.copy(photo.getInputStream(), target);
        log.debug("Saved photo to {}", target);
        return "/uploads/" + filename;
    }

    private static String sanitize(String filename) {
        if (filename == null) return "unknown";
        return filename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
