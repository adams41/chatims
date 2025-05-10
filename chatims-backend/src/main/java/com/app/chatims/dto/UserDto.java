    package com.app.chatims.dto;

    import com.app.chatims.util.Gender;
    import com.fasterxml.jackson.annotation.JsonProperty;
    import lombok.AllArgsConstructor;
    import lombok.Getter;
    import lombok.NoArgsConstructor;
    import lombok.Setter;
    import org.springframework.web.multipart.MultipartFile;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public class UserDto {

        private Long userId;

        private String keycloakId;

        private String name;

        private String email;

        private Integer age;

        private Gender gender;

        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        private String password;

        private MultipartFile photo;

    }
