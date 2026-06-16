package com.grcfortress.system.dto;

import java.time.Instant;

public record SystemHealthResponse(
        String backendStatus,
        String databaseStatus,
        Instant checkedAt
) {
}
