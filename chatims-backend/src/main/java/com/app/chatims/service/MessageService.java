package com.app.chatims.service;

import com.app.chatims.dto.MessageDto;
import com.app.chatims.entity.MessageEntity;

import java.util.List;

public interface MessageService {

    MessageEntity sendMessage(Long chatId, Long senderId, String content);

    List<MessageDto> getMessagesByChatId(Long chatId, Long viewerUserId);
}
