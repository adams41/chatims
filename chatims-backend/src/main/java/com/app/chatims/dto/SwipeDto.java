package com.app.chatims.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SwipeDto {

    private Long userId;

    private Long targetUserId;

    private boolean liked;

}
