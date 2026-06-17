package com.grcfortress.auth;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.auth.dto.CurrentUserResponse;
import com.grcfortress.auth.dto.LoginResponse;
import com.grcfortress.auth.dto.TokenResponse;
import com.grcfortress.common.audit.AuditEventType;
import com.grcfortress.common.audit.AuditOutcome;
import com.grcfortress.common.audit.AuditService;
import com.grcfortress.config.LockoutProperties;
import com.grcfortress.user.Role;
import com.grcfortress.user.User;
import com.grcfortress.user.UserRepository;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final MfaProperties mfaProperties;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final LockoutProperties lockoutProperties;
    private final RevokedTokenRepository revokedTokenRepository;

    public AuthService(AuthenticationManager authenticationManager,
                        UserRepository userRepository,
                        JwtService jwtService,
                        MfaProperties mfaProperties,
                        AuditService auditService,
                        PasswordEncoder passwordEncoder,
                        LockoutProperties lockoutProperties,
                        RevokedTokenRepository revokedTokenRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.mfaProperties = mfaProperties;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
        this.lockoutProperties = lockoutProperties;
        this.revokedTokenRepository = revokedTokenRepository;
    }

    @Transactional
    public LoginResponse login(String username, String password, String ipAddress) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (LockedException ex) {
            auditService.record(AuditEventType.LOGIN_FAILURE, username, "Account is locked", ipAddress, AuditOutcome.FAILURE);
            throw new AuthException("Account is locked due to multiple failed login attempts. Contact an administrator to unlock it.");
        } catch (DisabledException ex) {
            auditService.record(AuditEventType.LOGIN_FAILURE, username, "Account is disabled", ipAddress, AuditOutcome.FAILURE);
            throw new AuthException("Account is disabled");
        } catch (BadCredentialsException ex) {
            recordFailedAttempt(username, ipAddress);
            throw new AuthException("Invalid username or password");
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid username or password"));

        auditService.record(AuditEventType.LOGIN_SUCCESS, username, "Password verified", ipAddress, AuditOutcome.SUCCESS);

        if (user.isMfaEnabled()) {
            String mfaToken = jwtService.generateMfaPendingToken(username);
            auditService.record(AuditEventType.MFA_CHALLENGE_ISSUED, username, "MFA challenge issued", ipAddress, AuditOutcome.SUCCESS);
            return LoginResponse.mfaChallenge(mfaToken);
        }

        return LoginResponse.authenticated(issueTokens(user, ipAddress));
    }

    @Transactional
    public TokenResponse verifyMfa(String mfaToken, String code, String ipAddress) {
        Claims claims = parseMfaToken(mfaToken);
        String username = jwtService.extractUsername(claims);

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid MFA session"));

        boolean valid = mfaProperties.isBypassEnabled() && mfaProperties.getBypassCode().equals(code);
        // TODO: when TOTP enrollment is added, also validate against user.getMfaSecret().

        if (!valid) {
            auditService.record(AuditEventType.MFA_VERIFICATION_FAILURE, username, "Invalid MFA code", ipAddress, AuditOutcome.FAILURE);
            throw new AuthException("Invalid MFA code");
        }

        auditService.record(AuditEventType.MFA_VERIFICATION_SUCCESS, username, "MFA verified", ipAddress, AuditOutcome.SUCCESS);
        return issueTokens(user, ipAddress);
    }

    @Transactional
    public TokenResponse refresh(String refreshToken, String ipAddress) {
        Claims claims;
        try {
            claims = jwtService.parseClaims(refreshToken);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AuthException("Invalid refresh token");
        }

        if (jwtService.extractTokenType(claims) != TokenType.REFRESH || jwtService.isExpired(claims)) {
            throw new AuthException("Invalid or expired refresh token");
        }

        String jti = jwtService.extractTokenId(claims);
        if (jti != null && revokedTokenRepository.existsByJti(jti)) {
            throw new AuthException("Refresh token has been revoked");
        }

        String username = jwtService.extractUsername(claims);
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (!user.isEnabled() || user.isAccountLocked()) {
            throw new AuthException("Account is disabled or locked");
        }

        // Rotate: this refresh token is single-use. Revoking it here means a stolen and
        // already-used refresh token can't be replayed once the legitimate client refreshes.
        if (jti != null) {
            revokedTokenRepository.save(new RevokedToken(jti, jwtService.extractExpiration(claims)));
        }

        auditService.record(AuditEventType.TOKEN_REFRESH, username, "Access token refreshed", ipAddress, AuditOutcome.SUCCESS);
        return issueTokens(user, ipAddress);
    }

    @Transactional
    public void logout(String refreshToken, String ipAddress) {
        Claims claims;
        try {
            claims = jwtService.parseClaims(refreshToken);
        } catch (JwtException | IllegalArgumentException ex) {
            auditService.record(AuditEventType.LOGOUT, "unknown", "Logout with invalid token", ipAddress, AuditOutcome.FAILURE);
            return;
        }

        String username = jwtService.extractUsername(claims);
        if (jwtService.extractTokenType(claims) == TokenType.REFRESH && !jwtService.isExpired(claims)) {
            String jti = jwtService.extractTokenId(claims);
            if (jti != null && !revokedTokenRepository.existsByJti(jti)) {
                revokedTokenRepository.save(new RevokedToken(jti, jwtService.extractExpiration(claims)));
            }
        }
        auditService.record(AuditEventType.LOGOUT, username, "User logged out", ipAddress, AuditOutcome.SUCCESS);
    }

    public CurrentUserResponse currentUser(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("User not found"));

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return new CurrentUserResponse(user.getUsername(), user.getEmail(), user.getFullName(), roles, user.isMustChangePassword());
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword, String ipAddress) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            auditService.record(AuditEventType.PASSWORD_CHANGED, username, "Current password verification failed", ipAddress, AuditOutcome.FAILURE);
            throw new AuthException("Current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new AuthException("New password must be at least 8 characters long");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
        auditService.record(AuditEventType.PASSWORD_CHANGED, username, "Password changed by user", ipAddress, AuditOutcome.SUCCESS);
    }

    /**
     * Records a failed password attempt against the user (if one exists with this username) and
     * locks the account once {@code lockoutProperties.maxFailedAttempts} is reached. Looking up by
     * username regardless of whether authentication failed due to a bad password or an unknown
     * username keeps the client-facing error message identical either way.
     */
    private void recordFailedAttempt(String username, String ipAddress) {
        userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
            if (user.isAccountLocked()) {
                return;
            }
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= lockoutProperties.getMaxFailedAttempts()) {
                user.setAccountLocked(true);
                userRepository.save(user);
                auditService.record(AuditEventType.ACCOUNT_LOCKED, username,
                        "Account locked after " + attempts + " consecutive failed login attempts", ipAddress, AuditOutcome.FAILURE);
                return;
            }
            userRepository.save(user);
        });
        auditService.record(AuditEventType.LOGIN_FAILURE, username, "Invalid credentials", ipAddress, AuditOutcome.FAILURE);
    }

    private Claims parseMfaToken(String mfaToken) {
        try {
            Claims claims = jwtService.parseClaims(mfaToken);
            if (jwtService.extractTokenType(claims) != TokenType.MFA_PENDING || jwtService.isExpired(claims)) {
                throw new AuthException("Invalid or expired MFA session");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AuthException("Invalid or expired MFA session");
        }
    }

    private TokenResponse issueTokens(User user, String ipAddress) {
        List<String> roles = user.getRoles().stream().map(Role::getName).toList();
        String accessToken = jwtService.generateAccessToken(user.getUsername(), roles);
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        user.setLastLoginAt(Instant.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return new TokenResponse(accessToken, refreshToken);
    }
}
