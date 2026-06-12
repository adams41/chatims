package com.app.chatims.repository;

import com.app.chatims.entity.InviteCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InviteCodeRepository extends JpaRepository<InviteCodeEntity, String> {
}
