package com.app.chatims.service;

public interface BotReplyService {

    /**
     * Schedule a delayed bot reply in the given chat.
     * @param chatId chat where the bot should reply
     * @param botUserId the bot user that should appear as the sender
     * @param triggeringMessage the user's message that triggered the reply (used to pick a canned reply)
     */
    void scheduleReply(Long chatId, Long botUserId, String triggeringMessage);
}
