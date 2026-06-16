package com.grcfortress.common.audit;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.common.audit.dto.AuditLogResponse;
import com.grcfortress.common.audit.dto.AuditTrailPageResponse;

@RestController
@RequestMapping("/api/v1/audit-trail")
@PreAuthorize("hasAnyRole('ADMIN','AUDITOR','COMPLIANCE_OFFICER')")
public class AuditTrailController {

    private final AuditLogRepository auditLogRepository;

    public AuditTrailController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public AuditTrailPageResponse listAuditTrail(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String event
    ) {
        int safePage = Math.max(0, page);
        int safeSize = normalizeSize(size);
        String actorFilter = blankToNull(actor);
        AuditEventType eventType = parseEventType(event);
        PageRequest pageRequest = PageRequest.of(safePage, safeSize);

        Page<AuditLog> result = search(actorFilter, eventType, pageRequest);

        List<AuditLogResponse> content = result.stream()
                .map(this::toResponse)
                .toList();

        return new AuditTrailPageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getEventType(),
                log.getUsername(),
                log.getDetail(),
                log.getIpAddress(),
                log.getOutcome(),
                log.getCreatedAt()
        );
    }

    private Page<AuditLog> search(String actor, AuditEventType eventType, PageRequest pageRequest) {
        if (actor != null && eventType != null) {
            return auditLogRepository.findAllByUsernameContainingIgnoreCaseAndEventTypeOrderByCreatedAtDesc(
                    actor,
                    eventType,
                    pageRequest
            );
        }
        if (actor != null) {
            return auditLogRepository.findAllByUsernameContainingIgnoreCaseOrderByCreatedAtDesc(actor, pageRequest);
        }
        if (eventType != null) {
            return auditLogRepository.findAllByEventTypeOrderByCreatedAtDesc(eventType, pageRequest);
        }
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageRequest);
    }

    private int normalizeSize(int size) {
        if (size == 10 || size == 50 || size == 100) {
            return size;
        }
        return 50;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private AuditEventType parseEventType(String event) {
        if (event == null || event.isBlank()) {
            return null;
        }
        return AuditEventType.valueOf(event.trim().toUpperCase());
    }
}
