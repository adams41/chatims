package com.app.chatims.dto;

import com.app.chatims.util.Gender;
import com.app.chatims.util.Intent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MatchPreferencesDto(
        Gender preferredGender,
        @NotNull @Min(18) @Max(120) Integer minAge,
        @NotNull @Min(18) @Max(120) Integer maxAge,
        Intent intent
) {}
