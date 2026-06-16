package com.grcfortress.policy.dto;

import com.grcfortress.policy.StepStatus;

import java.time.Instant;
import java.util.List;

public record ApprovalStepDetail(
        Long id,
        int stepOrder,
        String departmentName,
        Long departmentId,
        String assignedToName,
        String assignedToEmailUsername,
        Long assignedToId,
        String delegatedToName,
        String delegatedToEmailUsername,
        Long delegatedToId,
        StepStatus status,
        String decision,
        String comments,
        Instant decidedAt,
        boolean isCurrentUserActiveActor,
        List<TeamMemberDto> departmentTeamMembers,
        List<StepMessageDto> messages
) {
}
