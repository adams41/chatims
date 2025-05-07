package com.app.chatims.controller;

import com.app.chatims.entity.MessageEntity;
import com.app.chatims.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;


    @PostMapping
    public ResponseEntity<MessageEntity> sendMessage(@RequestBody MessageEntity message) {
        return ResponseEntity.ok(messageService.sendMessage(message));
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<List<MessageEntity>> getMessages(@PathVariable Long chatId) {
        List<MessageEntity> messages = messageService.getMessagesByChatId(chatId);
        return messages.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(messages);
    }

    @Transactional
    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> deleteMessages(@PathVariable Long chatId) {
        messageService.deleteMessagesByChatId(chatId);
        return ResponseEntity.noContent().build();
    }
}
