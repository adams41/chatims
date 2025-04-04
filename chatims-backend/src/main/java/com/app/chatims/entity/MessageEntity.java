package com.app.chatims.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "messages", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"chatId", "senderId"})
})
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "chat_id", nullable = false)
    @JsonBackReference
    private ChatEntity chat;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false, unique = false)
    private String content;

    @Column(nullable = false, unique = false)
    private LocalDateTime sendTimestamp ;

}
