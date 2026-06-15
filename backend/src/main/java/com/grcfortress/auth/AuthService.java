package com.grcfortress.auth;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.auth.dto.CurrentUserResponse;
import com.grcfortress.auth.dto.LoginResponse;
import com.grcfortress.auth.dto.TokenResponse;
import com.grcfortress.common.audit.AuditEventType;
import com.grcfortress.common.audit.AuditOutcome;
import com.grcfortress.common.audit.AuditService;
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

    public AuthService(AuthenticationManager authenticationManager,
                        UserRepository userRepository,
                        JwtService jwtService,
                        MfaProperties mfaProperties,
                        AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.mfaProperties = mfaProperties;
        this.auditService = auditService;
    }

    @Transactional
    public LoginResponse login(String username, String password, String ipAddress) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException ex) {
            auditService.record(AuditEventType.LOGIN_FAILURE, username, "Invalid credentials", ipAddress, AuditOutcome.FAILURE);
            throw new AuthException("Invalid username or password");
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid username or password"));

        if (!user.isEnabled() || user.isAccountLocked()) {
            auditService.record(AuditEventType.LOGIN_FAILURE, username, "Account disabled or locked", ipAddress, AuditOutcome.FAILURE);
            throw new AuthException("Account is disabled or locked");
        }

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

        String username = jwtService.extractUsername(claims);
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (!user.isEnabled() || user.isAccountLocked()) {
            throw new AuthException("Account is disabled or locked");
        }

        auditService.record(AuditEventType.TOKEN_REFRESH, username, "Access token refreshed", ipAddress, AuditOutcome.SUCCESS);
        return issueTokens(user, ipAddress);
    }

    public CurrentUserResponse currentUser(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("User not found"));

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return new CurrentUserResponse(user.getUsername(), user.getEmail(), user.getFullName(), roles);
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
