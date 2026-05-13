package com.app.chatims.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateLocationRequest(
        @NotNull @Min(-90)  @Max(90)  Double latitude,
        @NotNull @Min(-180) @Max(180) Double longitude,
        @Min(1) @Max(20000) Integer maxDistanceKm
) {}
