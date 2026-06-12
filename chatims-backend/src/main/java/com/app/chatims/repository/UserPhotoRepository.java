package com.app.chatims.repository;

import com.app.chatims.entity.UserPhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPhotoRepository extends JpaRepository<UserPhotoEntity, Long> {
    List<UserPhotoEntity> findByUserIdOrderByPositionAsc(Long userId);
    Optional<UserPhotoEntity> findByUserIdAndPosition(Long userId, Integer position);
    void deleteByUserIdAndPosition(Long userId, Integer position);
}
