package com.grcfortress.common.audit.dto;

import java.time.Instant;

import com.grcfortress.common.audit.AuditEventType;
import com.grcfortress.common.audit.AuditOutcome;

public record AuditLogResponse(
        Long id,
        AuditEventType eventType,
        String username,
        String detail,
        String ipAddress,
        AuditOutcome outcome,
        Instant createdAt
) {
}
