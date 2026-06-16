package com.grcfortress.report.dto;

import java.time.Instant;
import java.util.List;

import com.grcfortress.report.ReportType;
import com.grcfortress.report.ReportedItemStatus;

public record ReportedItemDetail(
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
        Instant updatedAt,
        List<ReportedItemMessageResponse> messages
) {
}
