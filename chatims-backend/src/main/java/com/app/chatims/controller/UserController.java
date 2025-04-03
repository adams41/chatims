package com.app.chatims.controller;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserEntity> createUser(@RequestBody UserDto userDto) {
        UserEntity user = userService.registerUser(userDto);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserEntity> getUser (@PathVariable Long id) {
        UserEntity user = userService.getUserById(id);
        return ResponseEntity.ok(user);

    }

    @GetMapping
    public ResponseEntity<List<UserEntity>> getUser () {
        List<UserEntity> users = userService.getUsersForSwipe();
        return ResponseEntity.ok(users);

    }



}
