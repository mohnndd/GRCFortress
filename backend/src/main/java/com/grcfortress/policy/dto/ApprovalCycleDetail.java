package com.grcfortress.policy.dto;

import com.grcfortress.policy.CycleStatus;

import java.time.Instant;
import java.util.List;

public record ApprovalCycleDetail(
        Long id,
        CycleStatus status,
        int currentStepOrder,
        Instant initiatedAt,
        Instant completedAt,
        List<ApprovalStepDetail> steps
) {
}
