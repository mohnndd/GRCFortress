package com.grcfortress.sla;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.policy.DocumentType;
import com.grcfortress.policy.PolicyApprovalStep;
import com.grcfortress.policy.PolicyApprovalStepRepository;

@Service
@Transactional
public class SlaService {

    private final SlaProcessRuleRepository ruleRepository;
    private final PolicyApprovalStepRepository stepRepository;

    public SlaService(SlaProcessRuleRepository ruleRepository,
                      PolicyApprovalStepRepository stepRepository) {
        this.ruleRepository = ruleRepository;
        this.stepRepository = stepRepository;
    }

    @Transactional(readOnly = true)
    public List<SlaProcessRule> getRules() {
        return ruleRepository.findAll();
    }

    public SlaProcessRule upsertRule(String processType, int businessDaysPerStep) {
        SlaProcessRule rule = ruleRepository.findByProcessType(processType)
                .orElseGet(() -> new SlaProcessRule(processType, businessDaysPerStep));
        rule.setBusinessDaysPerStep(businessDaysPerStep);
        return ruleRepository.save(rule);
    }

    @Transactional(readOnly = true)
    public List<ActiveStepStatus> getActiveStepsStatus() {
        Map<String, Integer> slaDays = ruleRepository.findAll().stream()
                .collect(Collectors.toMap(SlaProcessRule::getProcessType, SlaProcessRule::getBusinessDaysPerStep));

        return stepRepository.findAllActive().stream().map(step -> {
            String processType = resolveProcessType(step);
            int slaLimit = slaDays.getOrDefault(processType, 5);
            int elapsed = businessDaysElapsed(step.getActivatedAt());
            String slaStatus = computeStatus(elapsed, slaLimit);
            return new ActiveStepStatus(
                    step.getId(),
                    step.getCycle().getPolicyVersion().getPolicy().getTitle(),
                    step.getCycle().getPolicyVersion().getPolicy().getPolicyNumber(),
                    processType,
                    step.getDepartment().getName(),
                    step.getStepOrder(),
                    step.getCycle().getSteps().size(),
                    step.getActivatedAt(),
                    elapsed,
                    slaLimit,
                    slaStatus
            );
        }).toList();
    }

    private String resolveProcessType(PolicyApprovalStep step) {
        DocumentType docType = step.getCycle().getPolicyVersion().getPolicy().getDocumentType();
        return switch (docType) {
            case POLICY -> "POLICY_APPROVAL";
            case PROCEDURE -> "PROCEDURE_APPROVAL";
        };
    }

    private int businessDaysElapsed(Instant activatedAt) {
        if (activatedAt == null) return 0;
        LocalDate start = activatedAt.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        int count = 0;
        LocalDate cur = start;
        while (!cur.isAfter(today)) {
            DayOfWeek dow = cur.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) count++;
            cur = cur.plusDays(1);
        }
        return count;
    }

    private String computeStatus(int elapsed, int slaLimit) {
        if (elapsed > slaLimit) return "BREACHED";
        if (elapsed >= (int) Math.ceil(slaLimit * 0.75)) return "AT_RISK";
        return "ON_TRACK";
    }

    public record ActiveStepStatus(
            Long stepId,
            String documentTitle,
            String documentNumber,
            String processType,
            String departmentName,
            int stepOrder,
            int totalSteps,
            Instant activatedAt,
            int businessDaysElapsed,
            int slaBusinessDays,
            String slaStatus
    ) {}
}
