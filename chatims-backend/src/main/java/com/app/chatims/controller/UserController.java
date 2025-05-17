package com.app.chatims.controller;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.service.UserService;
import com.app.chatims.util.Gender;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/complete-profile")
    public ResponseEntity<UserEntity> completeProfile(
            @RequestParam("keycloakId") String keycloakId,
            @RequestParam("name") String name,
            @RequestParam("age") Integer age,
            @RequestParam("gender") String gender,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        try {
            UserEntity user = userService.completeUserProfile(keycloakId, name, age, Gender.valueOf(gender), photo);
            return ResponseEntity.ok(user);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserEntity> getUser (@PathVariable Long id) {
        UserEntity user = userService.getUserById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();

    }

    @GetMapping
    public ResponseEntity<List<UserEntity>> getUsers () {
        List<UserEntity> users = userService.getUsersForSwipe();
        return ResponseEntity.ok(users);

    }

    @GetMapping("/by-sub/{sub}")
    public ResponseEntity<UserEntity> getUserByKeycloakId(@PathVariable String sub) {
        UserEntity user = userService.getUserByKeycloakId(sub);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }



}
