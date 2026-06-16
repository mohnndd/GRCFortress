package com.grcfortress.risk;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.risk.dto.RiskSummary;

@Service
@Transactional
public class RiskService {

    private final RiskRecordRepository riskRepo;
    private final RiskDomainRepository domainRepo;
    private final RiskCategoryRepository categoryRepo;

    public RiskService(RiskRecordRepository riskRepo,
                       RiskDomainRepository domainRepo,
                       RiskCategoryRepository categoryRepo) {
        this.riskRepo = riskRepo;
        this.domainRepo = domainRepo;
        this.categoryRepo = categoryRepo;
    }

    @Transactional(readOnly = true)
    public List<RiskDomain> listDomains() {
        return domainRepo.findAllByOrderBySortOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<RiskSummary> listRisks() {
        return riskRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public RiskSummary get(Long id) {
        return toSummary(require(id));
    }

    public RiskSummary create(RiskCreateRequest req) {
        String number = generateNumber();
        RiskRecord r = new RiskRecord(number, req.title().strip());
        applyFields(r, req);
        return toSummary(riskRepo.save(r));
    }

    public RiskSummary update(Long id, RiskCreateRequest req) {
        RiskRecord r = require(id);
        r.setTitle(req.title().strip());
        applyFields(r, req);
        return toSummary(riskRepo.save(r));
    }

    public void delete(Long id) {
        riskRepo.delete(require(id));
    }

    private void applyFields(RiskRecord r, RiskCreateRequest req) {
        r.setDescription(req.description());
        r.setStatus(req.status() != null ? req.status() : "OPEN");
        r.setRiskOwnerUsername(req.riskOwnerUsername());

        if (req.domainId() != null) {
            r.setDomain(domainRepo.findById(req.domainId()).orElse(null));
        } else {
            r.setDomain(null);
        }
        if (req.categoryId() != null) {
            r.setCategory(categoryRepo.findById(req.categoryId()).orElse(null));
        } else {
            r.setCategory(null);
        }

        r.setInherentLikelihood(clamp(req.inherentLikelihood(), 1, 5));
        r.setInherentImpactFinancial(clamp(req.inherentImpactFinancial(), 1, 5));
        r.setInherentImpactOperational(clamp(req.inherentImpactOperational(), 1, 5));
        r.setInherentImpactRegulatory(clamp(req.inherentImpactRegulatory(), 1, 5));
        r.setInherentImpactReputational(clamp(req.inherentImpactReputational(), 1, 5));

        r.setResidualLikelihood(clamp(req.residualLikelihood(), 1, 5));
        r.setResidualImpactFinancial(clamp(req.residualImpactFinancial(), 1, 5));
        r.setResidualImpactOperational(clamp(req.residualImpactOperational(), 1, 5));
        r.setResidualImpactRegulatory(clamp(req.residualImpactRegulatory(), 1, 5));
        r.setResidualImpactReputational(clamp(req.residualImpactReputational(), 1, 5));

        r.setTargetRiskScore(req.targetRiskScore());
        r.setTreatmentOption(req.treatmentOption());
        r.setTreatmentPlan(req.treatmentPlan());
        r.setRiskVelocity(req.riskVelocity());
        r.setRelatedRegulations(req.relatedRegulations());
        r.setReviewFrequency(req.reviewFrequency() != null ? req.reviewFrequency() : "QUARTERLY");
        r.setNextReviewDate(req.nextReviewDate());
        r.setLastReviewDate(req.lastReviewDate());
    }

    private RiskRecord require(Long id) {
        return riskRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + id));
    }

    private String generateNumber() {
        long count = riskRepo.count() + 1;
        return String.format("RR-%d-%04d", Year.now().getValue(), count);
    }

    private int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    private RiskSummary toSummary(RiskRecord r) {
        return new RiskSummary(
                r.getId(), r.getRiskNumber(), r.getTitle(), r.getDescription(),
                r.getDomain() != null ? r.getDomain().getId() : null,
                r.getDomain() != null ? r.getDomain().getName() : null,
                r.getCategory() != null ? r.getCategory().getId() : null,
                r.getCategory() != null ? r.getCategory().getName() : null,
                r.getRiskOwnerUsername(), r.getStatus(),
                r.getInherentLikelihood(),
                r.getInherentImpactFinancial(), r.getInherentImpactOperational(),
                r.getInherentImpactRegulatory(), r.getInherentImpactReputational(),
                r.getInherentCompositeImpact(), r.getInherentScore(),
                r.getResidualLikelihood(),
                r.getResidualImpactFinancial(), r.getResidualImpactOperational(),
                r.getResidualImpactRegulatory(), r.getResidualImpactReputational(),
                r.getResidualCompositeImpact(), r.getResidualScore(),
                r.getTargetRiskScore(), r.getTreatmentOption(), r.getTreatmentPlan(),
                r.getRiskVelocity(), r.getRelatedRegulations(), r.getReviewFrequency(),
                r.getNextReviewDate(), r.getLastReviewDate(),
                r.getCreatedAt(), r.getUpdatedAt(), r.getCreatedBy()
        );
    }

    public record RiskCreateRequest(
            String title, String description, String status,
            Long domainId, Long categoryId, String riskOwnerUsername,
            int inherentLikelihood,
            int inherentImpactFinancial, int inherentImpactOperational,
            int inherentImpactRegulatory, int inherentImpactReputational,
            int residualLikelihood,
            int residualImpactFinancial, int residualImpactOperational,
            int residualImpactRegulatory, int residualImpactReputational,
            Integer targetRiskScore, String treatmentOption, String treatmentPlan,
            String riskVelocity, String relatedRegulations,
            String reviewFrequency, LocalDate nextReviewDate, LocalDate lastReviewDate
    ) {}
}
