package com.app.chatims.service.impl;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.repository.ChatRepository;
import com.app.chatims.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;

    @Override
    public ChatEntity createChat(ChatEntity chatDto) {
        return chatRepository.save(chatDto);
    }

    @Override
    public ChatEntity getChatById(Long chatId) {
        Optional<ChatEntity> chats = chatRepository.findById(chatId);
        return chats.orElseThrow(() -> new RuntimeException("Chat not found"));
    }
}
