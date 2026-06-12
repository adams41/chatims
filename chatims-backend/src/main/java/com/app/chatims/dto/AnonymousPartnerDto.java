package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import com.app.chatims.util.Intent;

public record AnonymousPartnerDto(
        Long userId,
        String displayName,
        Integer age,
        Gender gender,
        Intent intent
) {
    public static AnonymousPartnerDto from(UserEntity u) {
        String initial = (u.getName() != null && !u.getName().isBlank())
                ? u.getName().substring(0, 1).toUpperCase() + "."
                : "Anon";
        return new AnonymousPartnerDto(u.getUserId(), initial, u.getAge(), u.getGender(), u.getIntent());
    }
}
