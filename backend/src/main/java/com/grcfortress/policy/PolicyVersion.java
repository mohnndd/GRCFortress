package com.grcfortress.policy;

import java.time.Instant;

import com.grcfortress.common.AuditableEntity;

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
@Table(name = "policy_versions")
public class PolicyVersion extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(name = "version_number", nullable = false, length = 50)
    private String versionNumber;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "file_path", length = 1000)
    private String filePath;

    @Column(name = "file_type", length = 10)
    private String fileType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "change_reason", nullable = false, columnDefinition = "TEXT")
    private String changeReason;

    @Column(name = "change_summary", columnDefinition = "TEXT")
    private String changeSummary;

    @Column(name = "previous_version_id")
    private Long previousVersionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PolicyVersionStatus status = PolicyVersionStatus.DRAFT;

    @Column(name = "pre_approval_required", nullable = false)
    private boolean preApprovalRequired = false;

    @Column(name = "pre_approval_stakeholder_id")
    private Long preApprovalStakeholderId;

    @Column(name = "pre_approval_status", length = 50)
    private String preApprovalStatus;

    @Column(name = "pre_approval_comments", columnDefinition = "TEXT")
    private String preApprovalComments;

    @Column(name = "pre_approval_decided_at")
    private Instant preApprovalDecidedAt;

    protected PolicyVersion() {
    }

    public PolicyVersion(Policy policy, String versionNumber, String changeReason,
                         String changeSummary, Long previousVersionId) {
        this.policy = policy;
        this.versionNumber = versionNumber;
        this.changeReason = changeReason;
        this.changeSummary = changeSummary;
        this.previousVersionId = previousVersionId;
    }

    public Long getId() { return id; }
    public Policy getPolicy() { return policy; }
    public String getVersionNumber() { return versionNumber; }

    public String getFileName() { return fileName; }
    public String getFilePath() { return filePath; }
    public String getFileType() { return fileType; }
    public Long getFileSizeBytes() { return fileSizeBytes; }

    public String getChangeReason() { return changeReason; }
    public String getChangeSummary() { return changeSummary; }
    public Long getPreviousVersionId() { return previousVersionId; }

    public PolicyVersionStatus getStatus() { return status; }
    public void setStatus(PolicyVersionStatus status) { this.status = status; }

    public boolean isPreApprovalRequired() { return preApprovalRequired; }
    public void setPreApprovalRequired(boolean preApprovalRequired) { this.preApprovalRequired = preApprovalRequired; }

    public Long getPreApprovalStakeholderId() { return preApprovalStakeholderId; }
    public void setPreApprovalStakeholderId(Long preApprovalStakeholderId) { this.preApprovalStakeholderId = preApprovalStakeholderId; }

    public String getPreApprovalStatus() { return preApprovalStatus; }
    public void setPreApprovalStatus(String preApprovalStatus) { this.preApprovalStatus = preApprovalStatus; }

    public String getPreApprovalComments() { return preApprovalComments; }
    public void setPreApprovalComments(String preApprovalComments) { this.preApprovalComments = preApprovalComments; }

    public Instant getPreApprovalDecidedAt() { return preApprovalDecidedAt; }
    public void setPreApprovalDecidedAt(Instant preApprovalDecidedAt) { this.preApprovalDecidedAt = preApprovalDecidedAt; }
}
