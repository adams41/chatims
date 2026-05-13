package com.app.chatims.service.impl;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.MessageEntity;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.MessageRepository;
import com.app.chatims.service.BotReplyService;
import com.app.chatims.util.ChatStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class BotReplyServiceImpl implements BotReplyService {

    private static final Logger log = LoggerFactory.getLogger(BotReplyServiceImpl.class);

    private static final List<String> CANNED_REPLIES = List.of(
            "Tell me more about that.",
            "Haha, that's interesting!",
            "What do you do for fun?",
            "I love meeting new people here.",
            "How was your day?",
            "Where are you from?",
            "Do you have any hobbies?",
            "Coffee or tea?",
            "What's on your mind right now?",
            "That made me smile :)"
    );

    private static final List<String> QUESTION_REPLIES = List.of(
            "Good question! Let me think...",
            "Hmm, hard to say. You?",
            "Honestly, I'm not sure yet.",
            "Depends on the day, really.",
            "I'd say yes — and you?"
    );

    private final TaskScheduler taskScheduler;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;

    @Override
    public void scheduleReply(Long chatId, Long botUserId, String triggeringMessage) {
        int delaySeconds = ThreadLocalRandom.current().nextInt(1, 4);
        String reply = pickReply(triggeringMessage);
        log.debug("Scheduling bot reply in chat {} from bot {} in {}s", chatId, botUserId, delaySeconds);
        taskScheduler.schedule(
                () -> persistReply(chatId, botUserId, reply),
                Instant.now().plusSeconds(delaySeconds)
        );
    }

    @Transactional
    public void persistReply(Long chatId, Long botUserId, String content) {
        ChatEntity chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null || chat.getStatus() != ChatStatus.ACTIVE) {
            return;
        }
        if (LocalDateTime.now().isAfter(chat.getEndsAt())) {
            return;
        }
        MessageEntity message = new MessageEntity();
        message.setChatId(chatId);
        message.setSenderId(botUserId);
        message.setContent(content);
        message.setSendTimestamp(LocalDateTime.now());
        messageRepository.save(message);
    }

    private String pickReply(String triggering) {
        boolean isQuestion = triggering != null && triggering.trim().endsWith("?");
        List<String> pool = isQuestion ? QUESTION_REPLIES : CANNED_REPLIES;
        return pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
    }
}
