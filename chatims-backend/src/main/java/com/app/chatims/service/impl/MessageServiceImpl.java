package com.app.chatims.service.impl;

import com.app.chatims.dto.MessageDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.exception.ChatNotFoundException;
import com.app.chatims.exception.MessageSendException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.MessageService;
import com.app.chatims.util.ChatStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;


@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageServiceImpl.class);

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final ConcurrentHashMap<Long, List<MessageDto>> chatMessages = new ConcurrentHashMap<>();
    private final AtomicLong messageIdSeq = new AtomicLong(1L);

    @Override
    public MessageDto sendMessage(Long chatId, Long senderId, String content) {
        ChatEntity chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));
        if (!chat.involves(senderId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        if (chat.getStatus() != ChatStatus.ACTIVE || LocalDateTime.now(ZoneOffset.UTC).isAfter(chat.getEndsAt())) {
            throw new MessageSendException("Chat is not active");
        }

        MessageDto dto = new MessageDto(
                messageIdSeq.getAndIncrement(),
                chatId,
                senderId,
                content,
                LocalDateTime.now(ZoneOffset.UTC)
        );
        chatMessages.computeIfAbsent(chatId, k -> new CopyOnWriteArrayList<>()).add(dto);
        pushToRecipient(chat, senderId, dto);
        return dto;
    }

    private void pushToRecipient(ChatEntity chat, Long senderId, MessageDto dto) {
        Long recipientId = chat.otherParticipant(senderId);
        userRepository.findById(recipientId).ifPresent(recipient ->
                messagingTemplate.convertAndSendToUser(recipient.getKeycloakId(), "/queue/messages", dto)
        );
    }

    @Override
    public List<MessageDto> getMessagesByChatId(Long chatId, Long viewerUserId) {
        ChatEntity chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));
        if (!chat.involves(viewerUserId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        List<MessageDto> list = chatMessages.get(chatId);
        return list == null ? List.of() : List.copyOf(list);
    }

    @Override
    public void purgeChat(Long chatId) {
        List<MessageDto> removed = chatMessages.remove(chatId);
        if (removed != null && !removed.isEmpty()) {
            log.debug("Purged {} in-memory messages for ended chat {}", removed.size(), chatId);
        }
    }
}
