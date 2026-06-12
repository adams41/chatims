package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import com.app.chatims.util.Intent;

import java.util.List;

public record UserProfileDto(
        Long id,
        String keycloakId,
        String name,
        String email,
        Integer age,
        Gender gender,
        String photoPath,
        List<String> photos,
        boolean preferencesSet,
        String whatsappNumber,
        String telegramHandle,
        String viberNumber,
        Gender preferredGender,
        Integer minAge,
        Integer maxAge,
        Intent intent,
        String theme,
        boolean hasContact,
        List<String> languages
) {
    public static UserProfileDto from(UserEntity u, List<String> photos) {
        boolean hasContact = notBlank(u.getWhatsappNumber())
                || notBlank(u.getTelegramHandle())
                || notBlank(u.getViberNumber());
        return new UserProfileDto(
                u.getUserId(),
                u.getKeycloakId(),
                u.getName(),
                u.getEmail(),
                u.getAge(),
                u.getGender(),
                u.getPhotoPath(),
                photos,
                u.isPreferencesSet(),
                u.getWhatsappNumber(),
                u.getTelegramHandle(),
                u.getViberNumber(),
                u.getPreferredGender(),
                u.getMinAge(),
                u.getMaxAge(),
                u.getIntent(),
                u.getTheme(),
                hasContact,
                parseLanguages(u.getLanguages())
        );
    }
    private static List<String> parseLanguages(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
    public static UserProfileDto from(UserEntity u) {
        return from(u, List.of());
    }
    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
}
