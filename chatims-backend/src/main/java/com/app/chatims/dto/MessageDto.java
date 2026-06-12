package com.app.chatims.dto;

import java.time.LocalDateTime;

public record MessageDto(
        Long id,
        Long chatId,
        Long senderId,
        String content,
        LocalDateTime sendTimestamp
) {}
