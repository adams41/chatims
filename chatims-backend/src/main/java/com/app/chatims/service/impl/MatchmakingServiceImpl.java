package com.app.chatims.service.impl;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MatchPreferencesDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.MatchmakingQueueEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.exception.UserNotFoundException;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.MatchmakingQueueRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.ChatService;
import com.app.chatims.service.MatchmakingService;
import com.app.chatims.util.ChatStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchmakingServiceImpl implements MatchmakingService {

    private static final Logger log = LoggerFactory.getLogger(MatchmakingServiceImpl.class);
    private static final int POLL_INTERVAL_MS = 3000;
    private static final int POLL_ATTEMPTS = 10;
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double DEFAULT_MAX_DISTANCE_KM = 100.0;

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MatchmakingQueueRepository queueRepository;
    private final ChatService chatService;

    @Override
    @Transactional
    public void joinQueue(String keycloakId, MatchPreferencesDto preferences) {
        UserEntity seeker = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + keycloakId));

        if (!hasAtLeastOneContact(seeker))
            throw new IllegalStateException("Add at least one contact method (WhatsApp, Telegram, or Viber) before matchmaking.");
        if (seeker.getGender() == null)
            throw new IllegalStateException("Your profile is incomplete. Please set your gender before starting a chat.");
        if (seeker.getAge() == null)
            throw new IllegalStateException("Your profile is incomplete. Please set your age before starting a chat.");
        if (preferences.minAge() > preferences.maxAge())
            throw new IllegalArgumentException("minAge must be <= maxAge");

        seeker.setPreferredGender(preferences.preferredGender());
        seeker.setMinAge(preferences.minAge());
        seeker.setMaxAge(preferences.maxAge());
        seeker.setIntent(preferences.intent());
        seeker.setPreferencesSet(true);
        seeker.setLastSeenAt(LocalDateTime.now());
        userRepository.save(seeker);

        chatRepository.findActiveChatsForUser(ChatStatus.ACTIVE, seeker.getUserId(), PageRequest.of(0, 10))
                .forEach(chat -> chatService.leaveChat(chat.getChatId(), seeker.getUserId()));

        MatchmakingQueueEntity entry = queueRepository.findById(seeker.getUserId())
                .orElse(new MatchmakingQueueEntity());
        entry.setUserId(seeker.getUserId());
        entry.setPreferredGender(preferences.preferredGender());
        entry.setMinAge(preferences.minAge());
        entry.setMaxAge(preferences.maxAge());
        entry.setJoinedAt(LocalDateTime.now());
        queueRepository.save(entry);
        log.info("User {} joined matchmaking queue", seeker.getUserId());
    }

    @Override
    public ChatSessionDto searchForHuman(String keycloakId) {
        UserEntity seeker = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + keycloakId));

        for (int i = 0; i < POLL_ATTEMPTS; i++) {
            List<ChatEntity> activeChats = chatRepository.findActiveChatsForUser(
                    ChatStatus.ACTIVE, seeker.getUserId(), PageRequest.of(0, 1));
            if (!activeChats.isEmpty() && LocalDateTime.now().isBefore(activeChats.get(0).getEndsAt())) {
                log.info("User {} picked up chat {} created by partner", seeker.getUserId(), activeChats.get(0).getChatId());
                queueRepository.deleteById(seeker.getUserId());
                return chatService.getSessionFor(activeChats.get(0).getChatId(), seeker.getUserId());
            }

            List<UserEntity> candidates = findCandidates(seeker);
            if (!candidates.isEmpty()) {
                ChatSessionDto result = matchWithHuman(seeker, candidates.get(0));
                if (result != null) return result;
            }

            try {
                Thread.sleep(POLL_INTERVAL_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        queueRepository.deleteById(seeker.getUserId());
        log.info("No human found for user {} after {}ms", seeker.getUserId(),
                (long) POLL_ATTEMPTS * POLL_INTERVAL_MS);
        return null;
    }

    private static final int REMATCH_COOLDOWN_HOURS = 24;

    protected List<UserEntity> findCandidates(UserEntity seeker) {
        LocalDateTime cooldownSince = LocalDateTime.now().minusHours(REMATCH_COOLDOWN_HOURS);
        List<Long> excludedPartners = chatRepository.findExcludedPartnerIds(seeker.getUserId(), cooldownSince);
        List<Long> excluded = excludedPartners.isEmpty() ? List.of(-1L) : excludedPartners;
        List<UserEntity> candidates = queueRepository.findCompatibleCandidates(
                seeker.getUserId(),
                excluded,
                seeker.getGender(),
                seeker.getPreferredGender(),
                seeker.getAge(),
                seeker.getMinAge() != null ? seeker.getMinAge() : 18,
                seeker.getMaxAge() != null ? seeker.getMaxAge() : 99,
                seeker.getIntent()
        );
        return filterByLanguage(filterByDistance(candidates, seeker), seeker);
    }

    private List<UserEntity> filterByLanguage(List<UserEntity> candidates, UserEntity seeker) {
        java.util.Set<String> seekerLangs = parseLangs(seeker.getLanguages());
        if (seekerLangs.isEmpty()) return candidates;
        return candidates.stream()
                .filter(c -> {
                    java.util.Set<String> cLangs = parseLangs(c.getLanguages());
                    if (cLangs.isEmpty()) return false;
                    for (String lang : seekerLangs) if (cLangs.contains(lang)) return true;
                    return false;
                })
                .toList();
    }

    private java.util.Set<String> parseLangs(String csv) {
        if (csv == null || csv.isBlank()) return java.util.Set.of();
        java.util.Set<String> out = new java.util.HashSet<>();
        for (String s : csv.split(",")) {
            String t = s.trim().toLowerCase();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    private static final int LOCK_STRIPES = 64;
    private static final Object[] LOCKS;
    static {
        LOCKS = new Object[LOCK_STRIPES];
        for (int i = 0; i < LOCK_STRIPES; i++) LOCKS[i] = new Object();
    }

    private static Object stripeFor(long userId) {
        return LOCKS[(int) (Math.floorMod(userId, LOCK_STRIPES))];
    }

    protected ChatSessionDto matchWithHuman(UserEntity seeker, UserEntity partner) {
        long id1 = Math.min(seeker.getUserId(), partner.getUserId());
        long id2 = Math.max(seeker.getUserId(), partner.getUserId());
        Object lock1 = stripeFor(id1);
        Object lock2 = stripeFor(id2);
        if (lock1 == lock2) {
            return doMatch(seeker, partner, lock1, null);
        }
        return doMatch(seeker, partner, lock1, lock2);
    }

    private ChatSessionDto doMatch(UserEntity seeker, UserEntity partner, Object lock1, Object lock2) {
        synchronized (lock1) {
            if (lock2 == null) {
                return claimAndCreate(seeker, partner);
            }
            synchronized (lock2) {
                return claimAndCreate(seeker, partner);
            }
        }
    }

    private ChatSessionDto claimAndCreate(UserEntity seeker, UserEntity partner) {
        boolean seekerInQueue = queueRepository.existsById(seeker.getUserId());
        boolean partnerInQueue = queueRepository.existsById(partner.getUserId());
        if (!seekerInQueue || !partnerInQueue) {
            log.info("Race condition: seeker={} inQueue={}, partner={} inQueue={} — skipping",
                    seeker.getUserId(), seekerInQueue, partner.getUserId(), partnerInQueue);
            return null;
        }
        queueRepository.deleteById(partner.getUserId());
        queueRepository.deleteById(seeker.getUserId());
        ChatEntity chat = chatService.createChat(seeker, partner);
        log.info("Matched user {} with human {} → chat {}", seeker.getUserId(), partner.getUserId(), chat.getChatId());
        return chatService.getSessionFor(chat.getChatId(), seeker.getUserId());
    }

    private List<UserEntity> filterByDistance(List<UserEntity> candidates, UserEntity seeker) {
        if (seeker.getLatitude() == null || seeker.getLongitude() == null) return candidates;
        return candidates.stream()
                .filter(c -> {
                    if (c.getLatitude() == null || c.getLongitude() == null) return true;
                    double dist = haversineKm(seeker.getLatitude(), seeker.getLongitude(),
                            c.getLatitude(), c.getLongitude());
                    double maxDist = c.getMaxDistanceKm() != null ? c.getMaxDistanceKm() : DEFAULT_MAX_DISTANCE_KM;
                    return dist <= maxDist;
                })
                .toList();
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @Override
    @Transactional
    public void leaveQueue(String keycloakId) {
        UserEntity user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + keycloakId));
        if (queueRepository.existsById(user.getUserId())) {
            queueRepository.deleteById(user.getUserId());
        }
    }

    private static boolean hasAtLeastOneContact(UserEntity u) {
        return notBlank(u.getWhatsappNumber()) || notBlank(u.getTelegramHandle()) || notBlank(u.getViberNumber());
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
