package com.app.chatims.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MessageDto {

    private Long chatId;

    private Long senderId;

    private String content;

    private LocalDateTime sendTimestamp;

}
