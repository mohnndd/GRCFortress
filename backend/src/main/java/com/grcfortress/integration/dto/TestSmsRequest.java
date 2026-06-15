package com.grcfortress.integration.dto;

import jakarta.validation.constraints.NotBlank;

public record TestSmsRequest(
        @NotBlank String to
) {
}
