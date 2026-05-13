package com.app.chatims.repository;

import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByKeycloakId(String keycloakId);

    @Query("""
           SELECT u FROM UserEntity u
           WHERE u.isBot = true
             AND u.age BETWEEN :minAge AND :maxAge
             AND (:preferredGender IS NULL OR u.gender = :preferredGender)
             AND u.userId <> :excludeUserId
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
           """)
    List<UserEntity> findCompatibleBots(
            @Param("preferredGender") Gender preferredGender,
            @Param("minAge") Integer minAge,
            @Param("maxAge") Integer maxAge,
            @Param("excludeUserId") Long excludeUserId,
            @Param("seekerLatitude") Double seekerLatitude,
            @Param("seekerLongitude") Double seekerLongitude
    );

    @Query("""
           SELECT u FROM UserEntity u
           WHERE u.isBot = true
             AND u.userId <> :excludeUserId
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
           """)
    List<UserEntity> findAnyBot(
            @Param("excludeUserId") Long excludeUserId,
            @Param("seekerLatitude") Double seekerLatitude,
            @Param("seekerLongitude") Double seekerLongitude
    );
}
