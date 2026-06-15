package com.grcfortress.integration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

public record TestEmailRequest(
        @NotBlank @Email String to
) {
}
