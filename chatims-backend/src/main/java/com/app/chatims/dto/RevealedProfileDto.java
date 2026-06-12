package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import com.app.chatims.util.Intent;

import java.util.List;

public record RevealedProfileDto(
        Long userId,
        String name,
        Integer age,
        Gender gender,
        String photoPath,
        List<String> photos,
        Intent intent,
        String whatsappNumber,
        String telegramHandle,
        String viberNumber,
        boolean youSharedContacts,
        boolean partnerSharedContacts,
        boolean contactsRevealed
) {
    public static RevealedProfileDto from(UserEntity u, List<String> photos,
                                          boolean youShared, boolean partnerShared) {
        boolean revealed = youShared && partnerShared;
        return new RevealedProfileDto(
                u.getUserId(),
                u.getName(),
                u.getAge(),
                u.getGender(),
                u.getPhotoPath(),
                photos,
                u.getIntent(),
                revealed ? u.getWhatsappNumber() : null,
                revealed ? u.getTelegramHandle() : null,
                revealed ? u.getViberNumber() : null,
                youShared,
                revealed,
                revealed
        );
    }
}
