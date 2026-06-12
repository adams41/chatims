package com.app.chatims.dto;

import com.app.chatims.entity.UserEntity;

import java.time.LocalDateTime;
import java.util.List;

public record DataExportDto(
        LocalDateTime exportedAt,
        Profile profile,
        List<MatchSummary> mutualMatches
) {
    public record Profile(
            Long id,
            String name,
            String email,
            Integer age,
            String gender,
            String photoPath,
            String whatsappNumber,
            String telegramHandle,
            String viberNumber,
            String preferredGender,
            Integer minAge,
            Integer maxAge,
            Double latitude,
            Double longitude,
            Integer maxDistanceKm,
            LocalDateTime lastSeenAt
    ) {
        public static Profile from(UserEntity u) {
            return new Profile(
                    u.getUserId(),
                    u.getName(),
                    u.getEmail(),
                    u.getAge(),
                    u.getGender() != null ? u.getGender().name() : null,
                    u.getPhotoPath(),
                    u.getWhatsappNumber(),
                    u.getTelegramHandle(),
                    u.getViberNumber(),
                    u.getPreferredGender() != null ? u.getPreferredGender().name() : null,
                    u.getMinAge(),
                    u.getMaxAge(),
                    u.getLatitude(),
                    u.getLongitude(),
                    u.getMaxDistanceKm(),
                    u.getLastSeenAt()
            );
        }
    }

    public record MatchSummary(
            Long chatId,
            LocalDateTime matchedAt,
            String partnerName,
            Integer partnerAge,
            String partnerWhatsapp,
            String partnerTelegram,
            String partnerViber
    ) {}
}
