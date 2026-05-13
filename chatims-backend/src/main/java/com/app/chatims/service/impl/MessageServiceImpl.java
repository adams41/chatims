package com.app.chatims.service.impl;

import com.app.chatims.dto.MessageDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.MessageEntity;
import com.app.chatims.exception.ChatNotFoundException;
import com.app.chatims.exception.MessageSendException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.MessageRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.BotReplyService;
import com.app.chatims.service.MessageService;
import com.app.chatims.util.ChatStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final BotReplyService botReplyService;

    @Override
    @Transactional
    public MessageEntity sendMessage(Long chatId, Long senderId, String content) {
        ChatEntity chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));
        if (!chat.involves(senderId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        if (chat.getStatus() != ChatStatus.ACTIVE || LocalDateTime.now().isAfter(chat.getEndsAt())) {
            throw new MessageSendException("Chat is not active");
        }

        MessageEntity message = new MessageEntity();
        message.setChatId(chatId);
        message.setSenderId(senderId);
        message.setContent(content);
        message.setSendTimestamp(LocalDateTime.now());
        MessageEntity saved = messageRepository.save(message);

        Long otherId = chat.otherParticipant(senderId);
        userRepository.findById(otherId).ifPresent(other -> {
            if (other.isBot()) {
                botReplyService.scheduleReply(chat.getChatId(), other.getUserId(), content);
            }
        });

        return saved;
    }

    @Override
    public List<MessageDto> getMessagesByChatId(Long chatId, Long viewerUserId) {
        ChatEntity chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));
        if (!chat.involves(viewerUserId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        return messageRepository.findByChatIdOrderBySendTimestampAsc(chatId)
                .stream().map(MessageDto::from).toList();
    }
}
