package com.grcfortress.observation.dto;

import java.time.Instant;

public record ObservationMessageDto(
        Long id,
        String authorUsername,
        String authorName,
        String message,
        Instant createdAt
) {}
