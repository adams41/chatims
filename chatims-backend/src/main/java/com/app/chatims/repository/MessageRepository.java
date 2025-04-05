package com.app.chatims.repository;

import com.app.chatims.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByChat_ChatId(Long chatId);

    void deleteByChat_ChatId(Long chatId);

}
