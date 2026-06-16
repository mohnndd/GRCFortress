package com.grcfortress.policy.dto;

import com.grcfortress.policy.PolicyVersionStatus;

import java.time.Instant;
import java.util.List;

public record PolicyVersionSummary(
        Long id,
        Long policyId,
        String versionNumber,
        List<PolicyVersionFileDto> files,
        String changeReason,
        String changeSummary,
        Long previousVersionId,
        PolicyVersionStatus status,
        boolean preApprovalRequired,
        String preApprovalStatus,
        String preApprovalAssigneeName,
        boolean isCurrentUserPreApprover,
        Instant createdAt,
        String createdBy
) {
}
