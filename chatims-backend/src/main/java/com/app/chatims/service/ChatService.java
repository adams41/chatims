package com.app.chatims.service;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.RevealedProfileDto;
import com.app.chatims.entity.ChatEntity;
import com.app.chatims.entity.UserEntity;

public interface ChatService {

    ChatEntity createChat(UserEntity user1, UserEntity user2);

    ChatSessionDto getSessionFor(Long chatId, Long viewerUserId);

    ChatSessionDto markLike(Long chatId, Long likerUserId);

    RevealedProfileDto getRevealedProfile(Long chatId, Long viewerUserId);

    void endIfExpired(Long chatId);

    void expireAllOverdueChats();

    void leaveChat(Long chatId, Long userId);

    RevealedProfileDto shareContacts(Long chatId, Long sharerUserId);
}
