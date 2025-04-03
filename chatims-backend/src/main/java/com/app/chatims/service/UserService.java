package com.app.chatims.service;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;

import java.util.List;

public interface UserService {

    UserEntity registerUser (UserDto userDto);
    UserEntity getUserById(Long userId);
    List<UserEntity> getUsersForSwipe();
}
