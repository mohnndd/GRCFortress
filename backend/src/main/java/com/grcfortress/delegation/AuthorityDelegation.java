package com.grcfortress.delegation;

import java.time.LocalDate;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "authority_delegations")
public class AuthorityDelegation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delegator_username", nullable = false, length = 64)
    private String delegatorUsername;

    @Column(name = "delegate_username", nullable = false, length = 64)
    private String delegateUsername;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom = LocalDate.now();

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    protected AuthorityDelegation() {}

    public AuthorityDelegation(String delegatorUsername, String delegateUsername,
                                String reason, LocalDate validFrom, LocalDate validUntil) {
        this.delegatorUsername = delegatorUsername;
        this.delegateUsername = delegateUsername;
        this.reason = reason;
        this.validFrom = validFrom != null ? validFrom : LocalDate.now();
        this.validUntil = validUntil;
    }

    public Long getId() { return id; }
    public String getDelegatorUsername() { return delegatorUsername; }
    public String getDelegateUsername() { return delegateUsername; }
    public String getReason() { return reason; }
    public LocalDate getValidFrom() { return validFrom; }
    public LocalDate getValidUntil() { return validUntil; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }
    public void setReason(String reason) { this.reason = reason; }
}
