package com.app.chatims.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ChatDto {

    private Long chatId;

    private List<String> chatParticipants;

    private List<String> chatMessages;

}
