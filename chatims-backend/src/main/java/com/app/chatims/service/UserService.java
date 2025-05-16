package com.app.chatims.service;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface UserService {

    UserEntity registerUser (UserDto userDto) throws IOException;
    UserEntity getUserById(Long userId);
    List<UserEntity> getUsersForSwipe();
    String savePhoto(MultipartFile photo) throws IOException;
    UserEntity getUserByKeycloakId(String keycloakId);

}
