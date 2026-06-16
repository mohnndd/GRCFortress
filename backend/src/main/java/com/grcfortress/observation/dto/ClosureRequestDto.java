package com.grcfortress.observation.dto;

import java.time.Instant;

public record ClosureRequestDto(
        Long id,
        String evidenceFileName,
        String evidenceFilePath,
        String notes,
        String status,
        String rejectionReason,
        String submittedBy,
        Instant submittedAt,
        String decidedBy,
        Instant decidedAt
) {}
