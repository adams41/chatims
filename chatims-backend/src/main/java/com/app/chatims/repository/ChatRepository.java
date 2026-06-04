package com.app.chatims.repository;

import com.app.chatims.entity.ChatEntity;
import com.app.chatims.util.ChatStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<ChatEntity, Long> {

    @Query("""
           SELECT c FROM ChatEntity c
           WHERE c.status = :status
             AND (c.user1Id = :userId OR c.user2Id = :userId)
           ORDER BY c.startedAt DESC
           """)
    List<ChatEntity> findActiveChatsForUser(
            @Param("status") ChatStatus status,
            @Param("userId") Long userId,
            Pageable pageable
    );

    @Query("""
           SELECT c FROM ChatEntity c
           WHERE (c.user1Id = :userId OR c.user2Id = :userId)
             AND c.user1Liked = true
             AND c.user2Liked = true
           ORDER BY c.startedAt DESC
           """)
    List<ChatEntity> findMutualMatchesForUser(@Param("userId") Long userId);

    @Query("""
           SELECT CASE WHEN c.user1Id = :userId THEN c.user2Id ELSE c.user1Id END
           FROM ChatEntity c
           WHERE c.user1Id = :userId OR c.user2Id = :userId
           """)
    List<Long> findExcludedPartnerIds(@Param("userId") Long userId);
}
