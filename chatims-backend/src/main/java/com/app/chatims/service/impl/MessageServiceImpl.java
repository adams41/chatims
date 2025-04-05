package com.app.chatims.service.impl;

import com.app.chatims.entity.MessageEntity;
import com.app.chatims.exception.ChatNotFoundException;
import com.app.chatims.exception.MessageSendException;
import com.app.chatims.repository.MessageRepository;
import com.app.chatims.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;

    @Override
    public MessageEntity sendMessage(MessageEntity message) {
        try {
            message.setSendTimestamp(LocalDateTime.now());
            return messageRepository.save(message);
        } catch (Exception e) {
            throw new MessageSendException("Error sending the message: " + e.getMessage(), e);
        }
    }

    @Override
    public List<MessageEntity> getMessagesByChatId(Long chatId) {
        Optional<List<MessageEntity>> messages = Optional.ofNullable(messageRepository.findByChat_ChatId(chatId));

        if(messages.isPresent() && !messages.get().isEmpty()) {
            return messages.get();
        } else {
            throw  new ChatNotFoundException("Chat with Id " + chatId + " not found!");
        }
    }

    @Override
    public void deleteMessagesByChatId(Long chatId) {
        messageRepository.deleteByChat_ChatId(chatId);
    }
}
