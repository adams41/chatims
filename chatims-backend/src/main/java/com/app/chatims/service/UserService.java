package com.app.chatims.service;

import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.dto.UpdateContactsRequest;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface UserService {

    UserEntity completeUserProfile(
            String keycloakId,
            String name,
            Integer age,
            Gender gender,
            MultipartFile photo
    ) throws IOException;

    UserEntity getUserById(Long userId);

    UserEntity getUserByKeycloakId(String keycloakId);

    UserEntity updateContacts(String keycloakId, UpdateContactsRequest request);

    UserEntity updatePreferences(String keycloakId, MatchPreferencesDto prefs);

    UserEntity replacePhoto(String keycloakId, MultipartFile photo) throws IOException;

    UserEntity updateLocation(String keycloakId, Double latitude, Double longitude, Integer maxDistanceKm);
}
