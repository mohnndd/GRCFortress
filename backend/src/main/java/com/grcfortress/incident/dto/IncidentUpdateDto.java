package com.grcfortress.incident.dto;

import java.time.Instant;

public record IncidentUpdateDto(
        Long id,
        String author,
        String content,
        String newStatus,
        Instant createdAt
) {}
