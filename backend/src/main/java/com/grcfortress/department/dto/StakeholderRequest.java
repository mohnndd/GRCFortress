package com.grcfortress.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StakeholderRequest(
        @NotBlank @Size(max = 255) String positionTitle,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(max = 50) String employeeNumber,

        /**
         * Saudi mobile number — international (+9665XXXXXXXX) or local (05XXXXXXXX).
         * Both forms are stored as-is; normalization to international format happens
         * in {@link com.grcfortress.department.DepartmentService}.
         */
        @NotBlank
        @Pattern(
                regexp = "^(?:\\+966|0)5\\d{8}$",
                message = "must be a valid Saudi mobile number: +9665XXXXXXXX or 05XXXXXXXX")
        String phoneNumber,

        /**
         * Local part of the email address only (no @ or domain). The system
         * appends the organization's configured email domain automatically.
         */
        @NotBlank
        @Pattern(
                regexp = "^[a-zA-Z0-9._%+\\-]+$",
                message = "must contain only letters, digits, dots, hyphens, underscores, or plus signs — no @ symbol")
        @Size(max = 100)
        String emailUsername
) {
}
