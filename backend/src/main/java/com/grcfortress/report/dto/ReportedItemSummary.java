package com.grcfortress.report.dto;

import java.time.Instant;

import com.grcfortress.report.ReportType;
import com.grcfortress.report.ReportedItemStatus;

public record ReportedItemSummary(
        Long id,
        ReportType reportType,
        String title,
        String description,
        ReportedItemStatus status,
        String reporterUsername,
        String attachmentFileName,
        String attachmentFileType,
        Long attachmentFileSizeBytes,
        Instant createdAt,
        Instant updatedAt
) {
}
