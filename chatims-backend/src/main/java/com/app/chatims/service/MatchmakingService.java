package com.app.chatims.service;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MatchPreferencesDto;

public interface MatchmakingService {

    /**
     * Try to find a chat partner for the user. Behaviour:
     *  1. Validate the user can chat (has at least one contact method).
     *  2. Look for a compatible human in the matchmaking queue.
     *  3. If none found, fall back to a compatible bot.
     *  4. Returns the active ChatSessionDto for the seeker's perspective.
     *
     * If the user is already in an active chat, returns that chat.
     */
    ChatSessionDto findOrCreateChat(String keycloakId, MatchPreferencesDto preferences);

    void leaveQueue(String keycloakId);
}
