package com.grcfortress.observation;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.fasterxml.uuid.Generators;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "observation_closure_requests")
public class ObservationClosureRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID uuid;


    public UUID getUuid() { return uuid; }

    @PrePersist
    private void assignUuid() {
        if (uuid == null) uuid = Generators.timeBasedEpochGenerator().generate();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id", nullable = false)
    private Observation observation;

    @Column(name = "evidence_file_name", length = 500)
    private String evidenceFileName;

    @Column(name = "evidence_file_path", length = 1000)
    private String evidenceFilePath;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "submitted_by", length = 64)
    private String submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "decided_by", length = 64)
    private String decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    protected ObservationClosureRequest() {}

    public ObservationClosureRequest(Observation observation, String submittedBy) {
        this.observation = observation;
        this.submittedBy = submittedBy;
        this.submittedAt = Instant.now();
        this.status = "PENDING";
    }

    public Long getId() { return id; }

    public Observation getObservation() { return observation; }

    public String getEvidenceFileName() { return evidenceFileName; }
    public void setEvidenceFileName(String evidenceFileName) { this.evidenceFileName = evidenceFileName; }

    public String getEvidenceFilePath() { return evidenceFilePath; }
    public void setEvidenceFilePath(String evidenceFilePath) { this.evidenceFilePath = evidenceFilePath; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }

    public Instant getSubmittedAt() { return submittedAt; }

    public String getDecidedBy() { return decidedBy; }
    public void setDecidedBy(String decidedBy) { this.decidedBy = decidedBy; }

    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
