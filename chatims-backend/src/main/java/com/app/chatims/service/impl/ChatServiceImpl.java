package com.app.chatims.service.impl;

import com.app.chatims.dto.AnonymousPartnerDto;
import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.RevealedProfileDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.exception.ChatNotFoundException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.ChatService;
import com.app.chatims.util.ChatStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    public static final Duration CHAT_DURATION = Duration.ofMinutes(7);

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

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

        // If the partner is a bot, auto-like back so users can test the match reveal flow
        Long partnerId = chat.otherParticipant(likerUserId);
        userRepository.findById(partnerId).ifPresent(partner -> {
            if (partner.isBot()) {
                if (isUser1) chat.setUser2Liked(true); else chat.setUser1Liked(true);
            }
        });

        chatRepository.save(chat);
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
        return RevealedProfileDto.from(partner);
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
        }
        return chat;
    }
}
