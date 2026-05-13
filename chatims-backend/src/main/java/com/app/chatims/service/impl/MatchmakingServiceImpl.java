package com.app.chatims.service.impl;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.MatchmakingQueueRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.ChatService;
import com.app.chatims.service.MatchmakingService;
import com.app.chatims.util.ChatStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class MatchmakingServiceImpl implements MatchmakingService {

    private static final Logger log = LoggerFactory.getLogger(MatchmakingServiceImpl.class);

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MatchmakingQueueRepository queueRepository;
    private final ChatService chatService;

    @Override
    @Transactional
    public ChatSessionDto findOrCreateChat(String keycloakId, MatchPreferencesDto preferences) {
        UserEntity seeker = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + keycloakId));

        if (!hasAtLeastOneContact(seeker)) {
            throw new IllegalStateException(
                    "Add at least one contact method (WhatsApp, Telegram, or Viber) before matchmaking."
            );
        }

        if (seeker.getGender() == null) {
            throw new IllegalStateException("Your profile is incomplete. Please set your gender before starting a chat.");
        }
        if (seeker.getAge() == null) {
            throw new IllegalStateException("Your profile is incomplete. Please set your age before starting a chat.");
        }

        // Persist updated preferences on the user
        if (preferences.minAge() > preferences.maxAge()) {
            throw new IllegalArgumentException("minAge must be <= maxAge");
        }
        seeker.setPreferredGender(preferences.preferredGender());
        seeker.setMinAge(preferences.minAge());
        seeker.setMaxAge(preferences.maxAge());
        seeker.setPreferencesSet(true);
        seeker.setLastSeenAt(LocalDateTime.now());
        userRepository.save(seeker);

        // If already in an active chat, return it.
        List<ChatEntity> activeChats = chatRepository.findActiveChatsForUser(ChatStatus.ACTIVE, seeker.getUserId(), PageRequest.of(0, 1));
        if (!activeChats.isEmpty() && LocalDateTime.now().isBefore(activeChats.get(0).getEndsAt())) {
            log.info("User {} already in chat {}", seeker.getUserId(), activeChats.get(0).getChatId());
            return chatService.getSessionFor(activeChats.get(0).getChatId(), seeker.getUserId());
        }

        // Try to match with a human in the queue (with distance filtering if location available)
        List<UserEntity> humanCandidates = queueRepository.findCompatibleCandidates(
                seeker.getUserId(),
                seeker.getGender(),
                preferences.preferredGender(),
                seeker.getAge(),
                preferences.minAge(),
                preferences.maxAge(),
                seeker.getLatitude(),
                seeker.getLongitude()
        );

        if (!humanCandidates.isEmpty()) {
            UserEntity partner = humanCandidates.get(0);
            queueRepository.deleteById(partner.getUserId());
            queueRepository.deleteById(seeker.getUserId());
            ChatEntity chat = chatService.createChat(seeker, partner);
            log.info("Matched user {} with human {} → chat {}", seeker.getUserId(), partner.getUserId(), chat.getChatId());
            return chatService.getSessionFor(chat.getChatId(), seeker.getUserId());
        }

        // Fallback: match with a compatible bot
        List<UserEntity> bots = userRepository.findCompatibleBots(
                preferences.preferredGender(),
                preferences.minAge(),
                preferences.maxAge(),
                seeker.getUserId(),
                seeker.getLatitude(),
                seeker.getLongitude()
        );

        if (!bots.isEmpty()) {
            UserEntity bot = bots.get(ThreadLocalRandom.current().nextInt(bots.size()));
            ChatEntity chat = chatService.createChat(seeker, bot);
            log.info("Matched user {} with bot {} → chat {}", seeker.getUserId(), bot.getUserId(), chat.getChatId());
            queueRepository.deleteById(seeker.getUserId());
            return chatService.getSessionFor(chat.getChatId(), seeker.getUserId());
        }

        // Second fallback: any bot ignoring age/gender — ensures matching ALWAYS succeeds
        List<UserEntity> anyBot = userRepository.findAnyBot(seeker.getUserId(), seeker.getLatitude(), seeker.getLongitude());
        if (!anyBot.isEmpty()) {
            UserEntity bot = anyBot.get(ThreadLocalRandom.current().nextInt(anyBot.size()));
            ChatEntity chat = chatService.createChat(seeker, bot);
            log.info("Matched user {} with fallback bot {} → chat {}", seeker.getUserId(), bot.getUserId(), chat.getChatId());
            queueRepository.deleteById(seeker.getUserId());
            return chatService.getSessionFor(chat.getChatId(), seeker.getUserId());
        }

        // No bots at all in DB — should not happen if V3 migration ran
        throw new IllegalStateException("No AI partners available. Please check that the database migration V3 ran successfully.");
    }

    @Override
    @Transactional
    public void leaveQueue(String keycloakId) {
        UserEntity user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + keycloakId));
        queueRepository.deleteById(user.getUserId());
    }

    private static boolean hasAtLeastOneContact(UserEntity u) {
        return notBlank(u.getWhatsappNumber()) || notBlank(u.getTelegramHandle()) || notBlank(u.getViberNumber());
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
