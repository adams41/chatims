package com.app.chatims.service.impl;

import com.app.chatims.entity.MessageEntity;
import com.app.chatims.repository.MessageRepository;
import com.app.chatims.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;

    @Override
    public MessageEntity sendMessage(MessageEntity message) {
        message.setSendTimestamp(LocalDateTime.now());
        return messageRepository.save(message);
    }

    @Override
    public List<MessageEntity> getMessagesByChatId(Long chatId) {
        return messageRepository.findByChat_ChatId(chatId);
    }
}
