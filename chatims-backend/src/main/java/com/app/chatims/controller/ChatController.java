package com.app.chatims.controller;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/create")
    public ResponseEntity<ChatEntity> createChat(@RequestBody ChatEntity chatEntity) {
        return ResponseEntity.ok(chatService.createChat(chatEntity));

    }

    @GetMapping("/{chatId}")
    public ResponseEntity<ChatEntity> getChatById (@PathVariable Long chatId) {
        return ResponseEntity.ok(chatService.getChatById(chatId));
    }

}


