package com.grcfortress.policy;

import java.time.Instant;

import com.grcfortress.common.AuditableEntity;
import com.grcfortress.department.Department;
import com.grcfortress.department.DepartmentStakeholder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_approval_steps")
public class PolicyApprovalStep extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private PolicyApprovalCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "step_order", nullable = false)
    private int stepOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_stakeholder_id")
    private DepartmentStakeholder assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delegated_to_stakeholder_id")
    private DepartmentStakeholder delegatedTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private StepStatus status = StepStatus.PENDING;

    @Column(name = "decision", length = 50)
    private String decision;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    protected PolicyApprovalStep() {
    }

    public PolicyApprovalStep(PolicyApprovalCycle cycle, Department department, int stepOrder,
                               DepartmentStakeholder assignedTo, StepStatus status) {
        this.cycle = cycle;
        this.department = department;
        this.stepOrder = stepOrder;
        this.assignedTo = assignedTo;
        this.status = status;
    }

    public Long getId() { return id; }
    public PolicyApprovalCycle getCycle() { return cycle; }
    public Department getDepartment() { return department; }
    public int getStepOrder() { return stepOrder; }

    public DepartmentStakeholder getAssignedTo() { return assignedTo; }
    public DepartmentStakeholder getDelegatedTo() { return delegatedTo; }
    public void setDelegatedTo(DepartmentStakeholder delegatedTo) { this.delegatedTo = delegatedTo; }

    public StepStatus getStatus() { return status; }
    public void setStatus(StepStatus status) { this.status = status; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }

    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
