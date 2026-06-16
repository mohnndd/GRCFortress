package com.grcfortress.department.dto;

public record StakeholderResponse(
        Long id,
        Long departmentId,
        String positionTitle,
        String firstName,
        String lastName,
        String employeeNumber,
        String phoneNumber,
        String emailUsername,
        String email,
        boolean isHead
) {
}
