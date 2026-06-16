package com.grcfortress.circular.dto;

import java.time.Instant;

public record CircularSummary(
        Long id,
        String circularNumber,
        String issuer,
        String description,
        Long departmentId,
        String departmentName,
        String attachmentFileName,
        String attachmentFileType,
        Long attachmentFileSizeBytes,
        Instant createdAt,
        Instant updatedAt
) {}
