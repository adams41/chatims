package com.app.chatims.service;

import com.app.chatims.dto.MessageDto;

import java.util.List;

public interface MessageService {

    MessageDto sendMessage(Long chatId, Long senderId, String content);

    List<MessageDto> getMessagesByChatId(Long chatId, Long viewerUserId);

    void purgeChat(Long chatId);
}
