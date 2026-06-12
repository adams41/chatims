package com.app.chatims.service.impl;

import com.app.chatims.dto.AnonymousPartnerDto;
import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.RevealedProfileDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.exception.ChatNotFoundException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserPhotoRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.ChatService;
import com.app.chatims.service.MessageService;
import com.app.chatims.util.ChatStatus;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    public static final Duration CHAT_DURATION = Duration.ofMinutes(7);

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final UserPhotoRepository userPhotoRepository;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChatEntity createChat(UserEntity user1, UserEntity user2) {
        ChatEntity chat = new ChatEntity();
        chat.setUser1Id(user1.getUserId());
        chat.setUser2Id(user2.getUserId());
        chat.setStatus(ChatStatus.ACTIVE);
        LocalDateTime now = LocalDateTime.now();
        chat.setStartedAt(now);
        chat.setEndsAt(now.plus(CHAT_DURATION));
        chat.setUser1Liked(false);
        chat.setUser2Liked(false);
        return chatRepository.save(chat);
    }

    @Override
    @Transactional
    public ChatSessionDto getSessionFor(Long chatId, Long viewerUserId) {
        ChatEntity chat = loadAndExpire(chatId);
        if (!chat.involves(viewerUserId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        Long otherId = chat.otherParticipant(viewerUserId);
        UserEntity partner = userRepository.findById(otherId)
                .orElseThrow(() -> new ChatNotFoundException("Partner missing for chat " + chatId));
        boolean isUser1 = chat.getUser1Id().equals(viewerUserId);
        return ChatSessionDto.of(chat, AnonymousPartnerDto.from(partner), isUser1);
    }

    @Override
    @Transactional
    public ChatSessionDto markLike(Long chatId, Long likerUserId) {
        ChatEntity chat = loadAndExpire(chatId);
        if (!chat.involves(likerUserId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        boolean isUser1 = chat.getUser1Id().equals(likerUserId);
        if (isUser1) chat.setUser1Liked(true); else chat.setUser2Liked(true);
        chatRepository.save(chat);
        pushSessionToPartner(chat, likerUserId);
        return getSessionFor(chatId, likerUserId);
    }

    @Override
    @Transactional
    public RevealedProfileDto getRevealedProfile(Long chatId, Long viewerUserId) {
        ChatEntity chat = loadAndExpire(chatId);
        if (!chat.involves(viewerUserId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        if (!chat.isMutualMatch()) {
            throw new AccessDeniedException("Profile reveal requires mutual like");
        }
        Long otherId = chat.otherParticipant(viewerUserId);
        UserEntity partner = userRepository.findById(otherId)
                .orElseThrow(() -> new ChatNotFoundException("Partner missing for chat " + chatId));
        List<String> photos = userPhotoRepository
                .findByUserIdOrderByPositionAsc(partner.getUserId())
                .stream()
                .map(photo -> photo.getPhotoPath())
                .toList();
        boolean isUser1 = chat.getUser1Id().equals(viewerUserId);
        boolean youShared = isUser1 ? chat.isUser1SharedContacts() : chat.isUser2SharedContacts();
        boolean partnerShared = isUser1 ? chat.isUser2SharedContacts() : chat.isUser1SharedContacts();
        return RevealedProfileDto.from(partner, photos, youShared, partnerShared);
    }

    @Override
    @Transactional
    public RevealedProfileDto shareContacts(Long chatId, Long sharerUserId) {
        ChatEntity chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));
        if (!chat.involves(sharerUserId)) {
            throw new AccessDeniedException("Not a participant of chat " + chatId);
        }
        if (!chat.isMutualMatch()) {
            throw new AccessDeniedException("Sharing contacts requires mutual like");
        }
        boolean isUser1 = chat.getUser1Id().equals(sharerUserId);
        if (isUser1) chat.setUser1SharedContacts(true);
        else chat.setUser2SharedContacts(true);
        chatRepository.save(chat);
        if (chat.isMutualContactShare()) {
            pushRevealToUser(chat, chat.otherParticipant(sharerUserId));
        }
        return getRevealedProfile(chatId, sharerUserId);
    }

    private void pushRevealToUser(ChatEntity chat, Long recipientId) {
        userRepository.findById(recipientId).ifPresent(recipient -> {
            try {
                RevealedProfileDto dto = getRevealedProfile(chat.getChatId(), recipientId);
                messagingTemplate.convertAndSendToUser(
                        recipient.getKeycloakId(),
                        "/queue/reveal",
                        dto
                );
            } catch (Exception e) {
                log.warn("Failed to push reveal update for chat {} to user {}: {}",
                        chat.getChatId(), recipientId, e.getMessage());
            }
        });
    }

    @Override
    @Transactional
    public void endIfExpired(Long chatId) {
        chatRepository.findById(chatId).ifPresent(this::expireIfNeeded);
    }

    @Override
    @Transactional
    public void leaveChat(Long chatId, Long userId) {
        chatRepository.findById(chatId).ifPresent(chat -> {
            if (chat.involves(userId) && chat.getStatus() == ChatStatus.ACTIVE) {
                chat.setStatus(ChatStatus.ENDED);
                chatRepository.save(chat);
                purgeMessages(chatId);
                pushSessionToPartner(chat, userId);
            }
        });
    }

    private ChatEntity loadAndExpire(Long chatId) {
        ChatEntity chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found: " + chatId));
        return expireIfNeeded(chat);
    }

    private ChatEntity expireIfNeeded(ChatEntity chat) {
        if (chat.getStatus() == ChatStatus.ACTIVE && LocalDateTime.now().isAfter(chat.getEndsAt())) {
            chat.setStatus(ChatStatus.ENDED);
            chatRepository.save(chat);
            purgeMessages(chat.getChatId());
            pushSessionToUser(chat, chat.getUser1Id());
            pushSessionToUser(chat, chat.getUser2Id());
        }
        return chat;
    }

    private void purgeMessages(Long chatId) {
        messageService.purgeChat(chatId);
    }

    private void pushSessionToPartner(ChatEntity chat, Long actingUserId) {
        pushSessionToUser(chat, chat.otherParticipant(actingUserId));
    }

    private void pushSessionToUser(ChatEntity chat, Long recipientId) {
        userRepository.findById(recipientId).ifPresent(recipient -> {
            UserEntity partner = userRepository.findById(chat.otherParticipant(recipientId))
                    .orElse(null);
            if (partner == null) return;
            boolean isUser1 = chat.getUser1Id().equals(recipientId);
            ChatSessionDto dto = ChatSessionDto.of(chat, AnonymousPartnerDto.from(partner), isUser1);
            messagingTemplate.convertAndSendToUser(
                    recipient.getKeycloakId(),
                    "/queue/session",
                    dto
            );
            log.debug("Pushed session update for chat {} to userId={}", chat.getChatId(), recipientId);
        });
    }
}
