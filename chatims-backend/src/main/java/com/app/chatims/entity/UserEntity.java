package com.app.chatims.entity;

import com.app.chatims.util.Gender;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    @Column(nullable = false, unique = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = false)
    private Integer age;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String photoPath;

}
