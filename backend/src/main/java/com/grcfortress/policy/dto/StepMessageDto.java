package com.grcfortress.policy.dto;

import java.time.Instant;

public record StepMessageDto(
        Long id,
        String authorUsername,
        String authorName,
        String message,
        Instant createdAt
) {
}
