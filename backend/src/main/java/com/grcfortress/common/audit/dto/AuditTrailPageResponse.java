package com.grcfortress.common.audit.dto;

import java.util.List;

public record AuditTrailPageResponse(
        List<AuditLogResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
