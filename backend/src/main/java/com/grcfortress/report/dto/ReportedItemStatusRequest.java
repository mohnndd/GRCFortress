package com.grcfortress.report.dto;

import jakarta.validation.constraints.NotNull;

import com.grcfortress.report.ReportedItemStatus;

public record ReportedItemStatusRequest(
        @NotNull
        ReportedItemStatus status
) {
}
