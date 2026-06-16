package com.grcfortress.policy.dto;

import com.grcfortress.policy.PolicyStatus;

import java.time.Instant;

public record PolicyListItem(
        Long id,
        String policyNumber,
        String title,
        String category,
        PolicyStatus status,
        String latestVersionNumber,
        Long latestVersionId,
        long versionCount,
        Instant createdAt,
        Instant updatedAt,
        String createdBy,
        Long departmentId,
        String departmentName,
        String product,
        String workflowFileName,
        String slaFileName
) {
}
