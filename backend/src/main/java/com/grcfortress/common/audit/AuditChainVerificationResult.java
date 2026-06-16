package com.grcfortress.common.audit;

/**
 * Result of re-walking the audit_log hash chain and recomputing each entry's
 * hash to confirm nothing between the genesis and the latest entry was altered.
 */
public record AuditChainVerificationResult(boolean valid, long entriesChecked, Long firstBrokenEntryId) {

    public static AuditChainVerificationResult valid(long entriesChecked) {
        return new AuditChainVerificationResult(true, entriesChecked, null);
    }

    public static AuditChainVerificationResult broken(long entriesChecked, long firstBrokenEntryId) {
        return new AuditChainVerificationResult(false, entriesChecked, firstBrokenEntryId);
    }
}
