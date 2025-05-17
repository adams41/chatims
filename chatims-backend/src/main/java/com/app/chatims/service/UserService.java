package com.app.chatims.service;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.util.Gender;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface UserService {

    UserEntity registerUser(UserDto userDto) throws IOException;

    UserEntity completeUserProfile(
            String keycloakId,
            String name,
            Integer age,
            Gender gender,
            MultipartFile photo
    ) throws IOException;

    UserEntity getUserById(Long userId);

    List<UserEntity> getUsersForSwipe();

    UserEntity getUserByKeycloakId(String keycloakId);

}
