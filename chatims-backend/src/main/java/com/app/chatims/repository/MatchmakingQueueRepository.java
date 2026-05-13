package com.app.chatims.repository;

import com.app.chatims.entity.MatchmakingQueueEntity;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchmakingQueueRepository extends JpaRepository<MatchmakingQueueEntity, Long> {

    /**
     * Find a queued candidate that:
     *  - is not the seeker
     *  - has gender matching seeker's preference (or seeker has no preference)
     *  - seeker's age is within candidate's age range
     *  - candidate's age is within seeker's age range
     *  - candidate's gender preference accepts seeker's gender (or none)
     *  - distance is between 1 km and candidate's max_distance_km (if both have location)
     */
    @Query("""
           SELECT u FROM MatchmakingQueueEntity q
           JOIN UserEntity u ON u.userId = q.userId
           WHERE q.userId <> :seekerId
             AND (:seekerPreferredGender IS NULL OR u.gender = :seekerPreferredGender)
             AND (q.preferredGender IS NULL OR q.preferredGender = :seekerGender)
             AND u.age BETWEEN :seekerMinAge AND :seekerMaxAge
             AND :seekerAge BETWEEN q.minAge AND q.maxAge
             AND (
               CASE WHEN :seekerLatitude IS NOT NULL AND u.latitude IS NOT NULL
                 THEN (6371 * ACOS(COS(RADIANS(90 - u.latitude))
                       * COS(RADIANS(90 - :seekerLatitude))
                       + SIN(RADIANS(90 - u.latitude))
                       * SIN(RADIANS(90 - :seekerLatitude))
                       * COS(RADIANS(u.longitude - :seekerLongitude))))
                       BETWEEN 1.0 AND COALESCE(u.max_distance_km, 100)
                 ELSE true
               END
             )
           ORDER BY q.joinedAt ASC
           """)
    List<UserEntity> findCompatibleCandidates(
            @Param("seekerId") Long seekerId,
            @Param("seekerGender") Gender seekerGender,
            @Param("seekerPreferredGender") Gender seekerPreferredGender,
            @Param("seekerAge") Integer seekerAge,
            @Param("seekerMinAge") Integer seekerMinAge,
            @Param("seekerMaxAge") Integer seekerMaxAge,
            @Param("seekerLatitude") Double seekerLatitude,
            @Param("seekerLongitude") Double seekerLongitude
    );
}
