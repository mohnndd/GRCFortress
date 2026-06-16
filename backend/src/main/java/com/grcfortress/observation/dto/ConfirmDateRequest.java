package com.grcfortress.observation.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record ConfirmDateRequest(
        @NotNull LocalDate confirmedTargetDate
) {}
