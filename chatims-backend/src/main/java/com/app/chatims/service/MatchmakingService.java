package com.app.chatims.service;

import com.app.chatims.dto.ChatSessionDto;
import com.app.chatims.dto.MatchPreferencesDto;

public interface MatchmakingService {

    void joinQueue(String keycloakId, MatchPreferencesDto preferences);
 
    ChatSessionDto searchForHuman(String keycloakId);

    void leaveQueue(String keycloakId);
}
