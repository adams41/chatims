package com.app.chatims.dto;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.util.ChatStatus;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

public record ChatSessionDto(
        Long chatId,
        AnonymousPartnerDto partner,
        ChatStatus status,
        Instant startedAt,
        Instant endsAt,
        long remainingSeconds,
        boolean youLiked,
        boolean partnerLiked,
        boolean mutualMatch
) {
    public static ChatSessionDto of(ChatEntity chat, AnonymousPartnerDto partner, boolean isUser1) {
        boolean youLiked = isUser1 ? chat.isUser1Liked() : chat.isUser2Liked();
        boolean partnerLiked = isUser1 ? chat.isUser2Liked() : chat.isUser1Liked();
        Instant endsAt = chat.getEndsAt().toInstant(ZoneOffset.UTC);
        long remaining = Math.max(0, Duration.between(Instant.now(), endsAt).getSeconds());
        return new ChatSessionDto(
                chat.getChatId(),
                partner,
                chat.getStatus(),
                chat.getStartedAt().toInstant(ZoneOffset.UTC),
                endsAt,
                remaining,
                youLiked,
                partnerLiked,
                chat.isMutualMatch()
        );
    }
}
