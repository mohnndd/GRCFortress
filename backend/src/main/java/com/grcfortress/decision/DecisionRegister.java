package com.grcfortress.decision;

import com.grcfortress.common.AuditableEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "decision_registers")
public class DecisionRegister extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "decision_number", nullable = false, unique = true, length = 50)
    private String decisionNumber;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "decision_date", nullable = false)
    private LocalDate decisionDate;

    @Column(name = "decision_maker", nullable = false, length = 200)
    private String decisionMaker;

    @Column(name = "related_risk", length = 200)
    private String relatedRisk;

    @Column(name = "related_policy_control", length = 300)
    private String relatedPolicyControl;

    @Column(name = "background_context", columnDefinition = "TEXT")
    private String backgroundContext;

    @Column(name = "alternatives_considered", columnDefinition = "TEXT")
    private String alternativesConsidered;

    @Column(name = "decision_outcome", columnDefinition = "TEXT")
    private String decisionOutcome;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "impact_assessment", columnDefinition = "TEXT")
    private String impactAssessment;

    @Column(name = "actions_required", columnDefinition = "TEXT")
    private String actionsRequired;

    @Column(name = "owner", length = 200)
    private String owner;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    public Long getId() { return id; }
    public String getDecisionNumber() { return decisionNumber; }
    public void setDecisionNumber(String v) { this.decisionNumber = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public LocalDate getDecisionDate() { return decisionDate; }
    public void setDecisionDate(LocalDate v) { this.decisionDate = v; }
    public String getDecisionMaker() { return decisionMaker; }
    public void setDecisionMaker(String v) { this.decisionMaker = v; }
    public String getRelatedRisk() { return relatedRisk; }
    public void setRelatedRisk(String v) { this.relatedRisk = v; }
    public String getRelatedPolicyControl() { return relatedPolicyControl; }
    public void setRelatedPolicyControl(String v) { this.relatedPolicyControl = v; }
    public String getBackgroundContext() { return backgroundContext; }
    public void setBackgroundContext(String v) { this.backgroundContext = v; }
    public String getAlternativesConsidered() { return alternativesConsidered; }
    public void setAlternativesConsidered(String v) { this.alternativesConsidered = v; }
    public String getDecisionOutcome() { return decisionOutcome; }
    public void setDecisionOutcome(String v) { this.decisionOutcome = v; }
    public String getJustification() { return justification; }
    public void setJustification(String v) { this.justification = v; }
    public String getImpactAssessment() { return impactAssessment; }
    public void setImpactAssessment(String v) { this.impactAssessment = v; }
    public String getActionsRequired() { return actionsRequired; }
    public void setActionsRequired(String v) { this.actionsRequired = v; }
    public String getOwner() { return owner; }
    public void setOwner(String v) { this.owner = v; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate v) { this.dueDate = v; }
    public LocalDate getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDate v) { this.reviewDate = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String v) { this.attachmentPath = v; }
    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String v) { this.attachmentName = v; }
}
