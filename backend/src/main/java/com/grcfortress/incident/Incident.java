package com.grcfortress.incident;

import com.grcfortress.department.Department;
import com.grcfortress.observation.Observation;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_number", nullable = false, unique = true, length = 20)
    private String incidentNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 10)
    private String priority = "P3";

    @Column(nullable = false, length = 30)
    private String status = "OPEN";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "reported_by", nullable = false, length = 64)
    private String reportedBy;

    @Column(name = "assigned_to", length = 64)
    private String assignedTo;

    @Column(name = "detected_at")
    private Instant detectedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "requires_regulatory_notification", nullable = false)
    private boolean requiresRegulatoryNotification = false;

    @Column(name = "regulatory_body", length = 200)
    private String regulatoryBody;

    @Column(name = "notified_at")
    private Instant notifiedAt;

    @Column(name = "notification_attachment_path", length = 500)
    private String notificationAttachmentPath;

    @Column(name = "notification_attachment_name", length = 255)
    private String notificationAttachmentName;

    @Column(name = "rca_required", nullable = false)
    private boolean rcaRequired = false;

    @Column(name = "rca_completed", nullable = false)
    private boolean rcaCompleted = false;

    @Column(name = "rca_summary", columnDefinition = "TEXT")
    private String rcaSummary;

    @Column(name = "rca_opens_observation", nullable = false)
    private boolean rcaOpensObservation = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_observation_id")
    private Observation linkedObservation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "updated_by", length = 64)
    private String updatedBy;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<IncidentUpdate> updates = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getIncidentNumber() { return incidentNumber; }
    public void setIncidentNumber(String incidentNumber) { this.incidentNumber = incidentNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public Instant getDetectedAt() { return detectedAt; }
    public void setDetectedAt(Instant detectedAt) { this.detectedAt = detectedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
    public boolean isRequiresRegulatoryNotification() { return requiresRegulatoryNotification; }
    public void setRequiresRegulatoryNotification(boolean v) { this.requiresRegulatoryNotification = v; }
    public String getRegulatoryBody() { return regulatoryBody; }
    public void setRegulatoryBody(String regulatoryBody) { this.regulatoryBody = regulatoryBody; }
    public Instant getNotifiedAt() { return notifiedAt; }
    public void setNotifiedAt(Instant notifiedAt) { this.notifiedAt = notifiedAt; }
    public String getNotificationAttachmentPath() { return notificationAttachmentPath; }
    public void setNotificationAttachmentPath(String p) { this.notificationAttachmentPath = p; }
    public String getNotificationAttachmentName() { return notificationAttachmentName; }
    public void setNotificationAttachmentName(String n) { this.notificationAttachmentName = n; }
    public boolean isRcaRequired() { return rcaRequired; }
    public void setRcaRequired(boolean rcaRequired) { this.rcaRequired = rcaRequired; }
    public boolean isRcaCompleted() { return rcaCompleted; }
    public void setRcaCompleted(boolean rcaCompleted) { this.rcaCompleted = rcaCompleted; }
    public String getRcaSummary() { return rcaSummary; }
    public void setRcaSummary(String rcaSummary) { this.rcaSummary = rcaSummary; }
    public boolean isRcaOpensObservation() { return rcaOpensObservation; }
    public void setRcaOpensObservation(boolean v) { this.rcaOpensObservation = v; }
    public Observation getLinkedObservation() { return linkedObservation; }
    public void setLinkedObservation(Observation linkedObservation) { this.linkedObservation = linkedObservation; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public List<IncidentUpdate> getUpdates() { return updates; }
}
