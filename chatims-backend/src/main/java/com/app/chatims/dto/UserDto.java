package com.app.chatims.dto;

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

}
