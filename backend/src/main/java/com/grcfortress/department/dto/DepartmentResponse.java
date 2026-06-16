package com.grcfortress.department.dto;

import java.time.Instant;

public record DepartmentResponse(
        Long id,
        String name,
        String description,
        int sortOrder,
        int stakeholderCount,
        Instant createdAt,
        Instant updatedAt
) {
}
