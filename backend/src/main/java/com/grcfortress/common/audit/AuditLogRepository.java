package com.grcfortress.common.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findAllByUsernameContainingIgnoreCaseOrderByCreatedAtDesc(String username, Pageable pageable);

    Page<AuditLog> findAllByEventTypeOrderByCreatedAtDesc(AuditEventType eventType, Pageable pageable);

    Page<AuditLog> findAllByUsernameContainingIgnoreCaseAndEventTypeOrderByCreatedAtDesc(
            String username,
            AuditEventType eventType,
            Pageable pageable
    );
}
