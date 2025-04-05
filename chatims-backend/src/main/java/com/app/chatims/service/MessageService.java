package com.app.chatims.service;

import com.app.chatims.entity.MessageEntity;

import java.util.List;

public interface MessageService {

    MessageEntity sendMessage(MessageEntity message);

    List<MessageEntity> getMessagesByChatId(Long chatId);

    void deleteMessagesByChatId(Long chatId);

}
