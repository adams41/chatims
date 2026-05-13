package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;

public record UserProfileDto(
        Long id,
        String keycloakId,
        String name,
        String email,
        Integer age,
        Gender gender,
        String photoPath,
        boolean preferencesSet,
        String whatsappNumber,
        String telegramHandle,
        String viberNumber,
        Gender preferredGender,
        Integer minAge,
        Integer maxAge,
        boolean hasContact
) {
    public static UserProfileDto from(UserEntity u) {
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
                u.isPreferencesSet(),
                u.getWhatsappNumber(),
                u.getTelegramHandle(),
                u.getViberNumber(),
                u.getPreferredGender(),
                u.getMinAge(),
                u.getMaxAge(),
                hasContact
        );
    }
    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
}
