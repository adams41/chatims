package com.app.chatims.repository;

import com.app.chatims.entity.SwipeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SwipeRepository extends JpaRepository<SwipeEntity, Long> {
}
