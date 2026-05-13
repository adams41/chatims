package com.app.chatims.controller;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MessageDto;
import com.app.chatims.dto.RevealedProfileDto;
import com.app.chatims.dto.SendMessageRequest;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.ChatService;
import com.app.chatims.service.MessageService;
import com.app.chatims.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;
    private final UserRepository userRepository;

    @GetMapping("/{chatId}")
    public ResponseEntity<ChatSessionDto> getSession(Authentication auth, @PathVariable Long chatId) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        return ResponseEntity.ok(chatService.getSessionFor(chatId, me.getUserId()));
    }

    @PostMapping("/{chatId}/like")
    public ResponseEntity<ChatSessionDto> like(Authentication auth, @PathVariable Long chatId) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        return ResponseEntity.ok(chatService.markLike(chatId, me.getUserId()));
    }

    @GetMapping("/{chatId}/reveal")
    public ResponseEntity<RevealedProfileDto> reveal(Authentication auth, @PathVariable Long chatId) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        return ResponseEntity.ok(chatService.getRevealedProfile(chatId, me.getUserId()));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<MessageDto>> getMessages(Authentication auth, @PathVariable Long chatId) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        return ResponseEntity.ok(messageService.getMessagesByChatId(chatId, me.getUserId()));
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> leaveChat(Authentication auth, @PathVariable Long chatId) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        chatService.leaveChat(chatId, me.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            Authentication auth,
            @PathVariable Long chatId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        UserEntity me = AuthUtils.currentUser(auth, userRepository);
        var saved = messageService.sendMessage(chatId, me.getUserId(), request.content());
        return ResponseEntity.ok(MessageDto.from(saved));
    }
}
