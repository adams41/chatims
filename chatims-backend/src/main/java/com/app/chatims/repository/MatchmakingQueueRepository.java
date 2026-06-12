package com.app.chatims.repository;

import com.app.chatims.entity.MatchmakingQueueEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import com.app.chatims.util.Intent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchmakingQueueRepository extends JpaRepository<MatchmakingQueueEntity, Long> {

    @Query("""
           SELECT u FROM MatchmakingQueueEntity q
           JOIN UserEntity u ON u.userId = q.userId
           WHERE q.userId <> :seekerId
             AND q.userId NOT IN :excludedIds
             AND (:seekerPreferredGender IS NULL OR u.gender = :seekerPreferredGender)
             AND (q.preferredGender IS NULL OR q.preferredGender = :seekerGender)
             AND u.age BETWEEN :seekerMinAge AND :seekerMaxAge
             AND :seekerAge BETWEEN q.minAge AND q.maxAge
             AND (:seekerIntent IS NULL OR u.intent IS NULL OR u.intent = :seekerIntent)
           ORDER BY q.joinedAt ASC
           """)
    List<UserEntity> findCompatibleCandidates(
            @Param("seekerId") Long seekerId,
            @Param("excludedIds") List<Long> excludedIds,
            @Param("seekerGender") Gender seekerGender,
            @Param("seekerPreferredGender") Gender seekerPreferredGender,
            @Param("seekerAge") Integer seekerAge,
            @Param("seekerMinAge") Integer seekerMinAge,
            @Param("seekerMaxAge") Integer seekerMaxAge,
            @Param("seekerIntent") Intent seekerIntent
    );
}
