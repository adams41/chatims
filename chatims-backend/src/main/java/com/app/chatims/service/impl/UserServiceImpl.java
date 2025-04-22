package com.app.chatims.service.impl;

import com.app.chatims.dto.UserDto;
import com.app.chatims.entity.UserEntity;
import com.app.chatims.repository.UserRepository;
import com.app.chatims.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public UserEntity registerUser(UserDto userDto) throws IOException {

        String photoPath = savePhoto(userDto.getPhoto());


       UserEntity user = new UserEntity();
       user.setName(userDto.getName());
       user.setEmail(userDto.getEmail());
       user.setPassword(userDto.getPassword());
       user.setAge(userDto.getAge());
       user.setGender(userDto.getGender());
       user.setPhotoPath(photoPath);
       return userRepository.save(user);

    }

    public String savePhoto(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) {
            return null;
        }

        String photoName = photo.getOriginalFilename();
        String photoPath = uploadDir + File.separator + photoName;


        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }

        Files.copy(photo.getInputStream(), Paths.get(photoPath));

        return photoPath;
    }

    @Override
    public UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    @Override
    public List<UserEntity> getUsersForSwipe() {
        return userRepository.findAll();
    }
}
