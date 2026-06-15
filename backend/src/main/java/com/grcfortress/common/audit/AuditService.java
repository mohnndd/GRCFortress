package com.grcfortress.common.audit;

import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(AuditEventType eventType, String username, String detail, String ipAddress, AuditOutcome outcome) {
        auditLogRepository.save(new AuditLog(eventType, username, detail, ipAddress, outcome));
    }
}
