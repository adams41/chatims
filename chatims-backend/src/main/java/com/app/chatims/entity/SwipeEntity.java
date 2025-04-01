package com.app.chatims.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "swipes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"userId", "targetUserId"})
})
public class SwipeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long targetUserId;

    @Column(nullable = false)
    private boolean liked;
}