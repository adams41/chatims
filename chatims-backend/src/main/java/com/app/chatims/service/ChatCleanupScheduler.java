package com.app.chatims.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class ChatCleanupScheduler {

    private final ChatService chatService;

    @Scheduled(fixedRate = 60_000)
    public void cleanupExpiredChats() {
        chatService.expireAllOverdueChats();
    }
}
