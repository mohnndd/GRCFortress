package com.grcfortress.policy;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "policy_acknowledgements",
       uniqueConstraints = @UniqueConstraint(columnNames = {"policy_id", "username"}))
public class PolicyAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "version_number", length = 20)
    private String versionNumber;

    @Column(name = "username", nullable = false, length = 64)
    private String username;

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(name = "acknowledged_at", nullable = false)
    private Instant acknowledgedAt = Instant.now();

    protected PolicyAcknowledgement() {}

    public PolicyAcknowledgement(Long policyId, String versionNumber, String username, String fullName) {
        this.policyId = policyId;
        this.versionNumber = versionNumber;
        this.username = username;
        this.fullName = fullName;
    }

    public Long getId() { return id; }
    public Long getPolicyId() { return policyId; }
    public String getVersionNumber() { return versionNumber; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public Instant getAcknowledgedAt() { return acknowledgedAt; }
}
