package com.app.chatims.dto;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.util.ChatStatus;

import java.time.Duration;
import java.time.LocalDateTime;

public record ChatSessionDto(
        Long chatId,
        AnonymousPartnerDto partner,
        ChatStatus status,
        LocalDateTime startedAt,
        LocalDateTime endsAt,
        long remainingSeconds,
        boolean youLiked,
        boolean partnerLiked,
        boolean mutualMatch
) {
    public static ChatSessionDto of(ChatEntity chat, AnonymousPartnerDto partner, boolean isUser1) {
        boolean youLiked = isUser1 ? chat.isUser1Liked() : chat.isUser2Liked();
        boolean partnerLiked = isUser1 ? chat.isUser2Liked() : chat.isUser1Liked();
        long remaining = Math.max(0, Duration.between(LocalDateTime.now(), chat.getEndsAt()).getSeconds());
        return new ChatSessionDto(
                chat.getChatId(),
                partner,
                chat.getStatus(),
                chat.getStartedAt(),
                chat.getEndsAt(),
                remaining,
                youLiked,
                partnerLiked,
                chat.isMutualMatch()
        );
    }
}
