package com.app.chatims.repository;

import com.app.chatims.entity.UserReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserReportRepository extends JpaRepository<UserReportEntity, Long> {
    boolean existsByReporterIdAndReportedIdAndChatId(Long reporterId, Long reportedId, Long chatId);
}
