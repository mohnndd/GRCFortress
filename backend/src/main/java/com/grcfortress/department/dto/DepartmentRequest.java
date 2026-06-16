package com.grcfortress.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 1000) String description,
        Integer sortOrder
) {
}
