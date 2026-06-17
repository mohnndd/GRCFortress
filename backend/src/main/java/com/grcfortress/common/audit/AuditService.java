package com.grcfortress.common.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Appends a new audit entry, chaining its hash to the previous entry's hash.
     *
     * <p>{@code synchronized} is intentional: without serializing writes, two
     * concurrent requests could both read the same "latest" hash and append
     * two entries claiming the same predecessor, which would make the chain
     * unverifiable. This assumes a single application instance; a
     * multi-instance deployment would need the chain link to be enforced in
     * the database instead (e.g. an advisory lock or a serializable
     * transaction keyed on the table).
     */
    public synchronized void record(AuditEventType eventType, String username, String detail, String ipAddress, AuditOutcome outcome) {
        String prevHash = auditLogRepository.findTopByOrderByIdDesc()
                .map(AuditLog::getEntryHash)
                .orElse(AuditLog.GENESIS_HASH);
        auditLogRepository.save(new AuditLog(eventType, username, detail, ipAddress, outcome, prevHash));
    }

    /**
     * Walks the audit_log table in insertion order and recomputes each
     * entry's hash to confirm the chain hasn't been tampered with. Intended
     * for periodic/manual integrity checks rather than the request hot path.
     */
    @Transactional(readOnly = true)
    public AuditChainVerificationResult verifyChain() {
        String expectedPrevHash = AuditLog.GENESIS_HASH;
        long checked = 0;
        for (AuditLog entry : auditLogRepository.findAllByOrderByIdAsc()) {
            checked++;
            boolean linkIntact = expectedPrevHash.equals(entry.getPrevHash());
            boolean hashIntact = entry.getEntryHash() != null && entry.getEntryHash().equals(entry.recomputeHash());
            if (!linkIntact || !hashIntact) {
                return AuditChainVerificationResult.broken(checked, entry.getId());
            }
            expectedPrevHash = entry.getEntryHash();
        }
        return AuditChainVerificationResult.valid(checked);
    }
}
