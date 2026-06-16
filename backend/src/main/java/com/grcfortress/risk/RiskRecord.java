package com.grcfortress.risk;

import java.time.LocalDate;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "risk_records")
public class RiskRecord extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "risk_number", nullable = false, unique = true, length = 20)
    private String riskNumber;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "domain_id")
    private RiskDomain domain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private RiskCategory category;

    @Column(name = "risk_owner_username", length = 64)
    private String riskOwnerUsername;

    @Column(nullable = false, length = 30)
    private String status = "OPEN";

    // Inherent scoring
    @Column(name = "inherent_likelihood", nullable = false)
    private int inherentLikelihood = 3;

    @Column(name = "inherent_impact_financial", nullable = false)
    private int inherentImpactFinancial = 3;

    @Column(name = "inherent_impact_operational", nullable = false)
    private int inherentImpactOperational = 3;

    @Column(name = "inherent_impact_regulatory", nullable = false)
    private int inherentImpactRegulatory = 3;

    @Column(name = "inherent_impact_reputational", nullable = false)
    private int inherentImpactReputational = 3;

    // Residual scoring
    @Column(name = "residual_likelihood", nullable = false)
    private int residualLikelihood = 1;

    @Column(name = "residual_impact_financial", nullable = false)
    private int residualImpactFinancial = 1;

    @Column(name = "residual_impact_operational", nullable = false)
    private int residualImpactOperational = 1;

    @Column(name = "residual_impact_regulatory", nullable = false)
    private int residualImpactRegulatory = 1;

    @Column(name = "residual_impact_reputational", nullable = false)
    private int residualImpactReputational = 1;

    @Column(name = "target_risk_score")
    private Integer targetRiskScore;

    @Column(name = "treatment_option", length = 20)
    private String treatmentOption;

    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(name = "risk_velocity", length = 20)
    private String riskVelocity;

    @Column(name = "related_regulations", columnDefinition = "TEXT")
    private String relatedRegulations;

    @Column(name = "review_frequency", nullable = false, length = 20)
    private String reviewFrequency = "QUARTERLY";

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "last_review_date")
    private LocalDate lastReviewDate;

    protected RiskRecord() {}

    public RiskRecord(String riskNumber, String title) {
        this.riskNumber = riskNumber;
        this.title = title;
    }

    // Calculated scores
    public int getInherentCompositeImpact() {
        return Math.max(Math.max(inherentImpactFinancial, inherentImpactOperational),
                        Math.max(inherentImpactRegulatory, inherentImpactReputational));
    }

    public int getInherentScore() {
        return inherentLikelihood * getInherentCompositeImpact();
    }

    public int getResidualCompositeImpact() {
        return Math.max(Math.max(residualImpactFinancial, residualImpactOperational),
                        Math.max(residualImpactRegulatory, residualImpactReputational));
    }

    public int getResidualScore() {
        return residualLikelihood * getResidualCompositeImpact();
    }

    // Getters
    public Long getId() { return id; }
    public String getRiskNumber() { return riskNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public RiskDomain getDomain() { return domain; }
    public void setDomain(RiskDomain domain) { this.domain = domain; }
    public RiskCategory getCategory() { return category; }
    public void setCategory(RiskCategory category) { this.category = category; }
    public String getRiskOwnerUsername() { return riskOwnerUsername; }
    public void setRiskOwnerUsername(String u) { this.riskOwnerUsername = u; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getInherentLikelihood() { return inherentLikelihood; }
    public void setInherentLikelihood(int v) { this.inherentLikelihood = v; }
    public int getInherentImpactFinancial() { return inherentImpactFinancial; }
    public void setInherentImpactFinancial(int v) { this.inherentImpactFinancial = v; }
    public int getInherentImpactOperational() { return inherentImpactOperational; }
    public void setInherentImpactOperational(int v) { this.inherentImpactOperational = v; }
    public int getInherentImpactRegulatory() { return inherentImpactRegulatory; }
    public void setInherentImpactRegulatory(int v) { this.inherentImpactRegulatory = v; }
    public int getInherentImpactReputational() { return inherentImpactReputational; }
    public void setInherentImpactReputational(int v) { this.inherentImpactReputational = v; }
    public int getResidualLikelihood() { return residualLikelihood; }
    public void setResidualLikelihood(int v) { this.residualLikelihood = v; }
    public int getResidualImpactFinancial() { return residualImpactFinancial; }
    public void setResidualImpactFinancial(int v) { this.residualImpactFinancial = v; }
    public int getResidualImpactOperational() { return residualImpactOperational; }
    public void setResidualImpactOperational(int v) { this.residualImpactOperational = v; }
    public int getResidualImpactRegulatory() { return residualImpactRegulatory; }
    public void setResidualImpactRegulatory(int v) { this.residualImpactRegulatory = v; }
    public int getResidualImpactReputational() { return residualImpactReputational; }
    public void setResidualImpactReputational(int v) { this.residualImpactReputational = v; }
    public Integer getTargetRiskScore() { return targetRiskScore; }
    public void setTargetRiskScore(Integer v) { this.targetRiskScore = v; }
    public String getTreatmentOption() { return treatmentOption; }
    public void setTreatmentOption(String v) { this.treatmentOption = v; }
    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String v) { this.treatmentPlan = v; }
    public String getRiskVelocity() { return riskVelocity; }
    public void setRiskVelocity(String v) { this.riskVelocity = v; }
    public String getRelatedRegulations() { return relatedRegulations; }
    public void setRelatedRegulations(String v) { this.relatedRegulations = v; }
    public String getReviewFrequency() { return reviewFrequency; }
    public void setReviewFrequency(String v) { this.reviewFrequency = v; }
    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate v) { this.nextReviewDate = v; }
    public LocalDate getLastReviewDate() { return lastReviewDate; }
    public void setLastReviewDate(LocalDate v) { this.lastReviewDate = v; }
}
