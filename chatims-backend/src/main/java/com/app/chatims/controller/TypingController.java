package com.app.chatims.controller;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.util.ChatStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class TypingController {

    private static final Logger log = LoggerFactory.getLogger(TypingController.class);

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public record TypingMessage(Long chatId, boolean typing) {}

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingMessage msg, Principal principal) {
        if (msg == null || msg.chatId() == null || principal == null) return;

        String keycloakId = principal.getName();
        UserEntity sender = userRepository.findByKeycloakId(keycloakId).orElse(null);
        if (sender == null) return;

        ChatEntity chat = chatRepository.findById(msg.chatId()).orElse(null);
        if (chat == null || !chat.involves(sender.getUserId())) return;
        if (chat.getStatus() != ChatStatus.ACTIVE) return;

        Long recipientId = chat.otherParticipant(sender.getUserId());
        userRepository.findById(recipientId).ifPresent(recipient ->
                messagingTemplate.convertAndSendToUser(
                        recipient.getKeycloakId(),
                        "/queue/typing",
                        Map.of("chatId", msg.chatId(), "typing", msg.typing())
                )
        );
        log.trace("Typing event from {} → {} (chat {})", sender.getUserId(), recipientId, msg.chatId());
    }
}
