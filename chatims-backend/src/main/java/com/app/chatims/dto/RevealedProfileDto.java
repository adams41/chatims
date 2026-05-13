package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;

public record RevealedProfileDto(
        Long userId,
        String name,
        Integer age,
        Gender gender,
        String photoPath,
        String whatsappNumber,
        String telegramHandle,
        String viberNumber
) {
    public static RevealedProfileDto from(UserEntity u) {
        return new RevealedProfileDto(
                u.getUserId(),
                u.getName(),
                u.getAge(),
                u.getGender(),
                u.getPhotoPath(),
                u.getWhatsappNumber(),
                u.getTelegramHandle(),
                u.getViberNumber()
        );
    }
}
