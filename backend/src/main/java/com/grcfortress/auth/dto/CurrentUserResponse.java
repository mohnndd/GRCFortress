package com.grcfortress.auth.dto;

import java.util.Set;

public record CurrentUserResponse(
        String username,
        String email,
        String fullName,
        Set<String> roles,
        boolean mustChangePassword
) {
}
