package com.grcfortress.common.audit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Immutable record of a security-relevant event (authentication, MFA,
 * token lifecycle, etc.) kept for SAMA/ISO 27001 audit-trail requirements.
 *
 * <p>Each row carries a SHA-256 {@code entryHash} computed over its own
 * content plus the {@code prevHash} of the row before it, forming a hash
 * chain: altering or deleting any past entry breaks the chain for every
 * entry after it, making tampering detectable by {@link AuditService#verifyChain()}.
 * The database additionally enforces append-only semantics via a trigger
 * (see {@code V13__audit_log_immutability.sql}) that rejects UPDATE/DELETE
 * on this table outright, so the hash chain is a detection mechanism on top
 * of a hard DB-level prevention mechanism.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    static final String GENESIS_HASH = "";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private AuditEventType eventType;

    @Column(name = "username", length = 64)
    private String username;

    @Column(name = "detail", length = 1000)
    private String detail;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false, length = 16)
    private AuditOutcome outcome;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "prev_hash", length = 64)
    private String prevHash;

    @Column(name = "entry_hash", length = 64)
    private String entryHash;

    protected AuditLog() {
    }

    public AuditLog(AuditEventType eventType, String username, String detail, String ipAddress,
                     AuditOutcome outcome, String prevHash) {
        this.eventType = eventType;
        this.username = username;
        this.detail = detail;
        this.ipAddress = ipAddress;
        this.outcome = outcome;
        this.createdAt = Instant.now();
        this.prevHash = prevHash;
        this.entryHash = computeHash(prevHash, eventType, username, detail, ipAddress, outcome, createdAt);
    }

    public Long getId() {
        return id;
    }

    public AuditEventType getEventType() {
        return eventType;
    }

    public String getUsername() {
        return username;
    }

    public String getDetail() {
        return detail;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public AuditOutcome getOutcome() {
        return outcome;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getPrevHash() {
        return prevHash;
    }

    public String getEntryHash() {
        return entryHash;
    }

    /** Recomputes the hash this row should have, for tamper verification. */
    public String recomputeHash() {
        return computeHash(prevHash, eventType, username, detail, ipAddress, outcome, createdAt);
    }

    static String computeHash(String prevHash, AuditEventType eventType, String username, String detail,
                               String ipAddress, AuditOutcome outcome, Instant createdAt) {
        String canonical = String.join("|",
                prevHash == null ? GENESIS_HASH : prevHash,
                eventType.name(),
                username == null ? "" : username,
                detail == null ? "" : detail,
                ipAddress == null ? "" : ipAddress,
                outcome.name(),
                createdAt.toString());
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required for audit-log integrity hashing", ex);
        }
    }
}
