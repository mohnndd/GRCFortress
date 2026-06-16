package com.grcfortress.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportedItemMessageRequest(
        @NotBlank
        @Size(max = 4000)
        String message
) {
}
