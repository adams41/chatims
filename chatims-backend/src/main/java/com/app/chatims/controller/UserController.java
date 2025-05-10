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

    @PostMapping("/register")
    public ResponseEntity<UserEntity> createUser(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("age") int age,
            @RequestParam("gender") Gender gender,
            @RequestParam("password") String password,
            @RequestParam(value = "photo") MultipartFile photo) throws IOException {

        try {
            if (photo == null || photo.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }


        UserDto userDto = new UserDto(null, null, name, email, age, gender, password, photo);
        UserEntity user = userService.registerUser(userDto);

        return ResponseEntity.ok(user);
    } catch (IOException e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }}

    @GetMapping("/{id}")
    public ResponseEntity<UserEntity> getUser (@PathVariable Long id) {
        UserEntity user = userService.getUserById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();

    }

    @GetMapping
    public ResponseEntity<List<UserEntity>> getUser () {
        List<UserEntity> users = userService.getUsersForSwipe();
        return ResponseEntity.ok(users);

    }



}
