package com.grcfortress.auth.dto;

/**
 * Result of step 1 of authentication. If {@code mfaRequired} is true, the
 * client must call /api/v1/auth/mfa/verify with the {@code mfaToken} and an
 * MFA code before receiving access/refresh tokens.
 */
public record LoginResponse(
        boolean mfaRequired,
        String mfaToken,
        TokenResponse tokens
) {
    public static LoginResponse mfaChallenge(String mfaToken) {
        return new LoginResponse(true, mfaToken, null);
    }

    public static LoginResponse authenticated(TokenResponse tokens) {
        return new LoginResponse(false, null, tokens);
    }
}
