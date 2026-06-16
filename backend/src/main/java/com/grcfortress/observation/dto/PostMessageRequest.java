package com.grcfortress.observation.dto;

import jakarta.validation.constraints.NotBlank;

public record PostMessageRequest(
        @NotBlank String message
) {}
