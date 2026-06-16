package com.grcfortress.policy.dto;

import jakarta.validation.constraints.NotNull;

public record DelegateRequest(@NotNull Long stakeholderId) {
}
