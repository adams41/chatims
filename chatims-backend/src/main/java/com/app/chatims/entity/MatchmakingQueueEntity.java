package com.app.chatims.entity;

import com.app.chatims.util.Gender;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "matchmaking_queue")
public class MatchmakingQueueEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    private Gender preferredGender;

    @Column(name = "min_age", nullable = false)
    private Integer minAge;

    @Column(name = "max_age", nullable = false)
    private Integer maxAge;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;
}
