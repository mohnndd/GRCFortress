package com.grcfortress.policy.dto;

import com.grcfortress.policy.PolicyStatus;

import java.time.Instant;
import java.util.List;

public record PolicyDetail(
        Long id,
        String policyNumber,
        String title,
        String description,
        String category,
        PolicyStatus status,
        List<PolicyVersionSummary> versions,
        Instant createdAt,
        Instant updatedAt,
        String createdBy,
        Long departmentId,
        String departmentName,
        String product,
        String workflowFileName,
        String workflowFilePath,
        String slaFileName,
        String slaFilePath
) {
}
