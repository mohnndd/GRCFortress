package com.grcfortress.policy.dto;

public record TeamMemberDto(
        Long id,
        String positionTitle,
        String firstName,
        String lastName,
        String emailUsername
) {
}
