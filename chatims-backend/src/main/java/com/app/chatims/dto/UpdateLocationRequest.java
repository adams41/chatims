package com.app.chatims.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateLocationRequest(
        @Min(-90)  @Max(90)  Double latitude,
        @Min(-180) @Max(180) Double longitude,
        @Min(1) @Max(500) Integer maxDistanceKm
) {}
