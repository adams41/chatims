package com.app.chatims.entity;

import com.app.chatims.util.ChatStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "chats")
public class ChatEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long chatId;

    @Column(name = "user1_id", nullable = false)
    private Long user1Id;

    @Column(name = "user2_id", nullable = false)
    private Long user2Id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;

    @Column(name = "user1_liked", nullable = false)
    private boolean user1Liked;

    @Column(name = "user2_liked", nullable = false)
    private boolean user2Liked;

    @Column(name = "match_removed_at")
    private LocalDateTime matchRemovedAt;

    @Column(name = "user1_shared_contacts", nullable = false)
    private boolean user1SharedContacts;

    @Column(name = "user2_shared_contacts", nullable = false)
    private boolean user2SharedContacts;

    public boolean isMutualMatch() {
        return user1Liked && user2Liked;
    }

    public boolean isMutualContactShare() {
        return user1SharedContacts && user2SharedContacts;
    }

    public boolean involves(Long userId) {
        return user1Id.equals(userId) || user2Id.equals(userId);
    }

    public Long otherParticipant(Long userId) {
        if (user1Id.equals(userId)) return user2Id;
        if (user2Id.equals(userId)) return user1Id;
        throw new IllegalArgumentException("User " + userId + " is not in chat " + chatId);
    }
}
