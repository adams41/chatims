package com.app.chatims.service.impl;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.KeycloakService;
import com.app.chatims.service.UserService;
import com.app.chatims.util.Gender;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final KeycloakService keycloakService;
    private final UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public UserEntity registerUser(UserDto userDto) throws IOException {
        String photoPath = savePhoto(userDto.getPhoto());

        String keycloakId = keycloakService.registerUserInKeycloak(
                userDto.getName(),
                userDto.getEmail(),
                userDto.getPassword()
        );

        UserEntity user = new UserEntity();
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setAge(userDto.getAge());
        user.setGender(userDto.getGender());
        user.setPhotoPath(photoPath);
        user.setKeycloakId(keycloakId);

        logger.info("Registered user: {} with Keycloak ID: {}", user.getName(), keycloakId);

        return userRepository.save(user);
    }

    @Override
    public UserEntity completeUserProfile(
            String keycloakId,
            String name,
            Integer age,
            Gender gender,
            MultipartFile photo
    ) throws IOException {
        if (userRepository.findByKeycloakId(keycloakId).isPresent()) {
            throw new IllegalStateException("User profile already completed for Keycloak ID: " + keycloakId);
        }

        String photoPath = savePhoto(photo);

        UserEntity user = new UserEntity();
        user.setName(name);
        user.setAge(age);
        user.setGender(gender);
        user.setPhotoPath(photoPath);
        user.setKeycloakId(keycloakId);

        logger.debug("Completing profile for Keycloak user: {}", keycloakId);

        return userRepository.save(user);
    }

    public String savePhoto(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) {
            logger.debug("Photo is not presented.");
            return null;
        }

        String uniqueFileName = UUID.randomUUID() + "_" + sanitizeFileName(photo.getOriginalFilename());
        String photoPath = Paths.get(uploadDir, uniqueFileName).toAbsolutePath().toString();

        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }

        logger.debug("Photo saved by path: {}", photoPath);
        Files.copy(photo.getInputStream(), Paths.get(photoPath));

        return "/uploads/" + uniqueFileName;
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "unknown";
        }
        return fileName.replaceAll("[^a-zA-Z0-9.-]", "_");
    }

    @Override
    public UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    @Override
    public List<UserEntity> getUsersForSwipe() {
        return userRepository.findAll();
    }

    @Override
    public UserEntity getUserByKeycloakId(String keycloakId) {
        return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found by Keycloak ID: " + keycloakId));
    }

    @Override
    public boolean setPreferencesFlag(Long id) {
        Optional<UserEntity> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            UserEntity user = optionalUser.get();
            user.setPreferencesSet(true);
            userRepository.save(user);
            return true;
        } else {
            return false;
        }
    }
}
