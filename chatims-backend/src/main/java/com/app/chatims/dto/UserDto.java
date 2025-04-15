package com.app.chatims.dto;

import com.app.chatims.util.Gender;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserDto {

    private Long userId;

    private String name;

    private String email;

    private Integer age;

    private Gender gender;

    private String password;

}
