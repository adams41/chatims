package com.app.chatims.service;

import com.app.chatims.entity.ChatEntity;

public interface ChatService {

    ChatEntity createChat(ChatEntity chatEntity);

    ChatEntity getChatById(Long chatId);

}
