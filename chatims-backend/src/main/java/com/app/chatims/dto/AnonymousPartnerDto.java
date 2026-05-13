package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;

public record AnonymousPartnerDto(
        Long userId,
        String displayName,
        Integer age,
        Gender gender
) {
    public static AnonymousPartnerDto from(UserEntity u) {
        // Anonymized: real name shown only after mutual match via RevealedProfileDto.
        // Display name uses first letter only to give a vague handle.
        String initial = (u.getName() != null && !u.getName().isBlank())
                ? u.getName().substring(0, 1).toUpperCase() + "."
                : "Anon";
        return new AnonymousPartnerDto(u.getUserId(), initial, u.getAge(), u.getGender());
    }
}
