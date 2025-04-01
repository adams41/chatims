package com.app.chatims.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "chats")
public class ChatEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long chatId;

    @ElementCollection
    @CollectionTable(name = "chat_participants", joinColumns = @JoinColumn(name = "chat_id"))
    @Column(name = "participant")
    private List<String> chatParticipants = new ArrayList<>();

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageEntity> chatMessages = new ArrayList<>();
}


