package com.grcfortress.common.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

/**
 * Verifies the audit_log hash chain links entries together and that
 * verifyChain() detects tampering with a past entry - the property the
 * append-only DB trigger and this chain together are meant to guarantee.
 */
class AuditServiceTest {

    private final AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
    private final AuditService auditService = new AuditService(auditLogRepository);

    @Test
    void firstEntryChainsFromGenesis() {
        when(auditLogRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());

        auditService.record(AuditEventType.LOGIN_SUCCESS, "jdoe", "ok", "127.0.0.1", AuditOutcome.SUCCESS);

        org.mockito.ArgumentCaptor<AuditLog> captor = org.mockito.ArgumentCaptor.forClass(AuditLog.class);
        org.mockito.Mockito.verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getPrevHash()).isEmpty();
        assertThat(captor.getValue().getEntryHash()).isEqualTo(captor.getValue().recomputeHash());
    }

    @Test
    void verifyChainDetectsTamperedEntry() throws Exception {
        AuditLog first = new AuditLog(AuditEventType.LOGIN_SUCCESS, "jdoe", "ok", "127.0.0.1", AuditOutcome.SUCCESS, "");
        setId(first, 1L);
        AuditLog second = new AuditLog(AuditEventType.LOGOUT, "jdoe", "bye", "127.0.0.1", AuditOutcome.SUCCESS, first.getEntryHash());
        setId(second, 2L);

        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of(first, second));

        AuditChainVerificationResult result = auditService.verifyChain();
        assertThat(result.valid()).isTrue();
        assertThat(result.entriesChecked()).isEqualTo(2);

        // Simulate tampering: mutate the detail of the first entry directly (bypassing the
        // append-only DB trigger, e.g. as if someone restored from a raw backup file).
        setField(first, "detail", "tampered");

        AuditChainVerificationResult tampered = auditService.verifyChain();
        assertThat(tampered.valid()).isFalse();
        assertThat(tampered.firstBrokenEntryId()).isEqualTo(1L);
    }

    private static void setId(AuditLog log, Long id) throws Exception {
        setField(log, "id", id);
    }

    private static void setField(AuditLog log, String fieldName, Object value) throws Exception {
        Field field = AuditLog.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(log, value);
    }
}
