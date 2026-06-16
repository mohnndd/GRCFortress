package com.grcfortress.policy;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_approval_cycles")
public class PolicyApprovalCycle extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_version_id", unique = true, nullable = false)
    private PolicyVersion policyVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private CycleStatus status = CycleStatus.IN_PROGRESS;

    @Column(name = "current_step_order", nullable = false)
    private int currentStepOrder = 1;

    @Column(name = "initiated_at", nullable = false)
    private Instant initiatedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    private List<PolicyApprovalStep> steps = new ArrayList<>();

    protected PolicyApprovalCycle() {
    }

    public PolicyApprovalCycle(PolicyVersion policyVersion) {
        this.policyVersion = policyVersion;
    }

    public Long getId() { return id; }
    public PolicyVersion getPolicyVersion() { return policyVersion; }

    public CycleStatus getStatus() { return status; }
    public void setStatus(CycleStatus status) { this.status = status; }

    public int getCurrentStepOrder() { return currentStepOrder; }
    public void setCurrentStepOrder(int currentStepOrder) { this.currentStepOrder = currentStepOrder; }

    public Instant getInitiatedAt() { return initiatedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public List<PolicyApprovalStep> getSteps() { return steps; }
}
