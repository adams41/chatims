package com.app.chatims.dto;

import com.app.chatims.entity.MessageEntity;

import java.time.LocalDateTime;

public record MessageDto(
        Long id,
        Long chatId,
        Long senderId,
        String content,
        LocalDateTime sendTimestamp
) {
    public static MessageDto from(MessageEntity m) {
        return new MessageDto(m.getId(), m.getChatId(), m.getSenderId(), m.getContent(), m.getSendTimestamp());
    }
}
