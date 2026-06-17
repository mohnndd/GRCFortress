package com.grcfortress.user.dto;

import java.time.Instant;
import java.util.Set;

public record UserSummary(
        Long id,
        String username,
        String email,
        String fullName,
        Set<String> roles,
        boolean mfaEnabled,
        boolean enabled,
        boolean accountLocked,
        boolean mustChangePassword,
        Instant lastLoginAt
) {
}
