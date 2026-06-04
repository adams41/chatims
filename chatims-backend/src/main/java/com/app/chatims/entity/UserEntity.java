package com.app.chatims.entity;

import com.app.chatims.util.Gender;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String keycloakId;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    private String photoPath;

    @Column(name = "preferences_set", nullable = false)
    private boolean preferencesSet;

    // Contact methods (at least one required to chat)
    private String whatsappNumber;
    private String telegramHandle;
    private String viberNumber;

    // Chat preferences
    @Enumerated(EnumType.STRING)
    private Gender preferredGender;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    // Geolocation (nullable; user opts in by sharing browser location).
    private Double latitude;
    private Double longitude;

    @Column(name = "max_distance_km")
    private Integer maxDistanceKm;
}
