package com.app.chatims.service;

import com.app.chatims.dto.DataExportDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.dto.UpdateContactsRequest;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

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

    DataExportDto exportUserData(String keycloakId);

    void deleteAccount(String keycloakId);

    List<String> getPhotosFor(Long userId);

    UserEntity addPhoto(String keycloakId, MultipartFile photo) throws IOException;

    UserEntity removePhotoAt(String keycloakId, Integer position);

    void removeMatch(String keycloakId, Long partnerId);

    UserEntity updateTheme(String keycloakId, String theme);

    UserEntity updateLanguages(String keycloakId, List<String> languages);
}
