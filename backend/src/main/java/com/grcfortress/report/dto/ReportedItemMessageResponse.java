package com.grcfortress.report.dto;

import java.time.Instant;

public record ReportedItemMessageResponse(
        Long id,
        String authorUsername,
        String message,
        Instant createdAt
) {
}
