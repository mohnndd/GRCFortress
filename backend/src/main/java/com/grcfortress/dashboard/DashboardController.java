package com.grcfortress.dashboard;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.circular.CircularRepository;
import com.grcfortress.circular.dto.CircularSummary;
import com.grcfortress.delegation.DelegationService;
import com.grcfortress.observation.ObservationRepository;
import com.grcfortress.policy.PolicyApprovalStep;
import com.grcfortress.policy.PolicyApprovalStepRepository;
import com.grcfortress.policy.PolicyRepository;
import com.grcfortress.policy.PolicyStatus;
import com.grcfortress.risk.RiskRecordRepository;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final PolicyApprovalStepRepository stepRepository;
    private final ObservationRepository observationRepository;
    private final CircularRepository circularRepository;
    private final PolicyRepository policyRepository;
    private final RiskRecordRepository riskRepository;
    private final DelegationService delegationService;

    public DashboardController(PolicyApprovalStepRepository stepRepository,
                               ObservationRepository observationRepository,
                               CircularRepository circularRepository,
                               PolicyRepository policyRepository,
                               RiskRecordRepository riskRepository,
                               DelegationService delegationService) {
        this.stepRepository = stepRepository;
        this.observationRepository = observationRepository;
        this.circularRepository = circularRepository;
        this.policyRepository = policyRepository;
        this.riskRepository = riskRepository;
        this.delegationService = delegationService;
    }

    @GetMapping
    public DashboardData getDashboard(Principal principal) {
        String username = principal.getName();

        // Pending approval steps for this user (assigned or delegated)
        List<PendingStepDto> pendingSteps = stepRepository.findAllActive().stream()
                .filter(s -> {
                    var actor = s.getDelegatedTo() != null ? s.getDelegatedTo() : s.getAssignedTo();
                    if (actor == null) return false;
                    if (actor.getEmailUsername().equalsIgnoreCase(username)) return true;
                    return delegationService.isDelegatedBy(actor.getEmailUsername(), username);
                })
                .map(s -> {
                    var actor = s.getDelegatedTo() != null ? s.getDelegatedTo() : s.getAssignedTo();
                    boolean isDelegated = actor != null
                            && !actor.getEmailUsername().equalsIgnoreCase(username);
                    return new PendingStepDto(
                            s.getId(),
                            s.getCycle().getPolicyVersion().getPolicy().getTitle(),
                            s.getCycle().getPolicyVersion().getPolicy().getPolicyNumber(),
                            s.getCycle().getPolicyVersion().getPolicy().getDocumentType().name(),
                            s.getDepartment().getName(),
                            s.getStepOrder(),
                            s.getCycle().getSteps().size(),
                            s.getActivatedAt(),
                            isDelegated,
                            isDelegated && actor != null ? actor.getEmailUsername() : null
                    );
                }).toList();

        // Recent circulars
        List<CircularSummary> recentCirculars = circularRepository.findAllByOrderByCreatedAtDesc()
                .stream().limit(5)
                .map(c -> new CircularSummary(
                        c.getId(), c.getCircularNumber(), c.getIssuer(), c.getDescription(),
                        c.getDepartment() != null ? c.getDepartment().getId() : null,
                        c.getDepartment() != null ? c.getDepartment().getName() : null,
                        c.getAttachmentFileName(), c.getAttachmentFileType(),
                        c.getAttachmentFileSizeBytes(), c.getCreatedAt(), c.getUpdatedAt()
                )).toList();

        // Stats
        long totalPolicies = policyRepository.count();
        long openObservations = observationRepository.findAllByOrderByUpdatedAtDesc().stream()
                .filter(o -> o.getStatus().name().equals("OPEN") || o.getStatus().name().equals("IN_PROGRESS"))
                .count();
        long totalRisks = riskRepository.count();
        long totalCirculars = circularRepository.count();

        return new DashboardData(pendingSteps, recentCirculars,
                new Stats(totalPolicies, openObservations, totalRisks, totalCirculars));
    }

    public record PendingStepDto(
            Long stepId, String documentTitle, String documentNumber,
            String documentType, String departmentName,
            int stepOrder, int totalSteps, Instant activatedAt,
            boolean isDelegated, String originalAssignee
    ) {}

    public record Stats(long totalPolicies, long openObservations, long totalRisks, long totalCirculars) {}

    public record DashboardData(
            List<PendingStepDto> pendingApprovalSteps,
            List<CircularSummary> recentCirculars,
            Stats stats
    ) {}
}
