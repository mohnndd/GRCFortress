package com.grcfortress.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import io.jsonwebtoken.Claims;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.grcfortress.auth.dto.LoginResponse;
import com.grcfortress.auth.dto.TokenResponse;
import com.grcfortress.common.audit.AuditEventType;
import com.grcfortress.common.audit.AuditOutcome;
import com.grcfortress.common.audit.AuditService;
import com.grcfortress.config.LockoutProperties;
import com.grcfortress.user.User;
import com.grcfortress.user.UserRepository;

/**
 * Unit tests for the login lockout policy and self-service password change.
 * Pure Mockito (no Spring context / DB) so this runs fast as a safety net
 * against regressions in {@link AuthService}.
 */
class AuthServiceTest {

    private AuthenticationManager authenticationManager;
    private UserRepository userRepository;
    private JwtService jwtService;
    private MfaProperties mfaProperties;
    private AuditService auditService;
    private PasswordEncoder passwordEncoder;
    private RevokedTokenRepository revokedTokenRepository;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authenticationManager = mock(AuthenticationManager.class);
        userRepository = mock(UserRepository.class);
        jwtService = mock(JwtService.class);
        mfaProperties = mock(MfaProperties.class);
        auditService = mock(AuditService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        revokedTokenRepository = mock(RevokedTokenRepository.class);

        LockoutProperties lockoutProperties = new LockoutProperties();
        lockoutProperties.setMaxFailedAttempts(3);

        authService = new AuthService(authenticationManager, userRepository, jwtService,
                mfaProperties, auditService, passwordEncoder, lockoutProperties, revokedTokenRepository);
    }

    private User userWithAttempts(int attempts) {
        User user = new User("jdoe", "jdoe@example.com", "Jane Doe", "hash", false);
        user.setFailedLoginAttempts(attempts);
        return user;
    }

    @Test
    void successfulLoginWithoutMfaIssuesTokens() {
        User user = userWithAttempts(0);
        when(userRepository.findByUsernameIgnoreCase("jdoe")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(eq("jdoe"), anyList())).thenReturn("access");
        when(jwtService.generateRefreshToken("jdoe")).thenReturn("refresh");

        LoginResponse response = authService.login("jdoe", "correct-password", "127.0.0.1");

        assertThat(response.mfaRequired()).isFalse();
        assertThat(response.tokens().accessToken()).isEqualTo("access");
        assertThat(user.getFailedLoginAttempts()).isZero();
        verify(auditService).record(eq(AuditEventType.LOGIN_SUCCESS), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.SUCCESS));
    }

    @Test
    void badCredentialsIncrementsFailedAttemptsWithoutLockingBelowThreshold() {
        User user = userWithAttempts(0);
        when(userRepository.findByUsernameIgnoreCase("jdoe")).thenReturn(Optional.of(user));
        doThrow(new BadCredentialsException("bad")).when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login("jdoe", "wrong", "127.0.0.1"))
                .isInstanceOf(AuthException.class);

        assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
        assertThat(user.isAccountLocked()).isFalse();
        verify(auditService, never()).record(eq(AuditEventType.ACCOUNT_LOCKED), any(), any(), any(), any());
    }

    @Test
    void thirdConsecutiveBadCredentialsLocksAccount() {
        User user = userWithAttempts(2);
        when(userRepository.findByUsernameIgnoreCase("jdoe")).thenReturn(Optional.of(user));
        doThrow(new BadCredentialsException("bad")).when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login("jdoe", "wrong", "127.0.0.1"))
                .isInstanceOf(AuthException.class);

        assertThat(user.getFailedLoginAttempts()).isEqualTo(3);
        assertThat(user.isAccountLocked()).isTrue();
        verify(auditService).record(eq(AuditEventType.ACCOUNT_LOCKED), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.FAILURE));
    }

    @Test
    void lockedAccountRejectsLoginWithoutQueryingOrIncrementing() {
        doThrow(new LockedException("locked")).when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login("jdoe", "whatever", "127.0.0.1"))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("locked");

        verify(userRepository, never()).findByUsernameIgnoreCase(any());
        verify(auditService).record(eq(AuditEventType.LOGIN_FAILURE), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.FAILURE));
    }

    @Test
    void changePasswordSucceedsWithCorrectCurrentPassword() {
        User user = userWithAttempts(0);
        user.setMustChangePassword(true);
        when(userRepository.findByUsernameIgnoreCase("jdoe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("temp", "hash")).thenReturn(true);
        when(passwordEncoder.encode("NewPassw0rd!")).thenReturn("new-hash");

        authService.changePassword("jdoe", "temp", "NewPassw0rd!", "127.0.0.1");

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(user.isMustChangePassword()).isFalse();
        verify(auditService).record(eq(AuditEventType.PASSWORD_CHANGED), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.SUCCESS));
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        User user = userWithAttempts(0);
        when(userRepository.findByUsernameIgnoreCase("jdoe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("jdoe", "wrong", "NewPassw0rd!", "127.0.0.1"))
                .isInstanceOf(AuthException.class);

        assertThat(user.getPasswordHash()).isEqualTo("hash");
        verify(auditService).record(eq(AuditEventType.PASSWORD_CHANGED), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.FAILURE));
    }

    @Test
    void refreshRejectsRevokedToken() {
        Claims claims = mock(Claims.class);
        when(jwtService.parseClaims("refresh-token")).thenReturn(claims);
        when(jwtService.extractTokenType(claims)).thenReturn(TokenType.REFRESH);
        when(jwtService.isExpired(claims)).thenReturn(false);
        when(jwtService.extractTokenId(claims)).thenReturn("jti-1");
        when(revokedTokenRepository.existsByJti("jti-1")).thenReturn(true);

        assertThatThrownBy(() -> authService.refresh("refresh-token", "127.0.0.1"))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("revoked");

        verify(userRepository, never()).findByUsernameIgnoreCase(any());
    }

    @Test
    void successfulRefreshRotatesTokenByRevokingTheOldOne() {
        User user = userWithAttempts(0);
        Claims claims = mock(Claims.class);
        Instant expiry = Instant.now().plusSeconds(60);
        when(jwtService.parseClaims("refresh-token")).thenReturn(claims);
        when(jwtService.extractTokenType(claims)).thenReturn(TokenType.REFRESH);
        when(jwtService.isExpired(claims)).thenReturn(false);
        when(jwtService.extractTokenId(claims)).thenReturn("jti-1");
        when(jwtService.extractExpiration(claims)).thenReturn(expiry);
        when(jwtService.extractUsername(claims)).thenReturn("jdoe");
        when(revokedTokenRepository.existsByJti("jti-1")).thenReturn(false);
        when(userRepository.findByUsernameIgnoreCase("jdoe")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(eq("jdoe"), anyList())).thenReturn("new-access");
        when(jwtService.generateRefreshToken("jdoe")).thenReturn("new-refresh");

        TokenResponse response = authService.refresh("refresh-token", "127.0.0.1");

        assertThat(response.accessToken()).isEqualTo("new-access");
        verify(revokedTokenRepository).save(argThat(token -> token.getJti().equals("jti-1")));
        verify(auditService).record(eq(AuditEventType.TOKEN_REFRESH), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.SUCCESS));
    }

    @Test
    void logoutRevokesValidRefreshToken() {
        Claims claims = mock(Claims.class);
        Instant expiry = Instant.now().plusSeconds(60);
        when(jwtService.parseClaims("refresh-token")).thenReturn(claims);
        when(jwtService.extractUsername(claims)).thenReturn("jdoe");
        when(jwtService.extractTokenType(claims)).thenReturn(TokenType.REFRESH);
        when(jwtService.isExpired(claims)).thenReturn(false);
        when(jwtService.extractTokenId(claims)).thenReturn("jti-1");
        when(jwtService.extractExpiration(claims)).thenReturn(expiry);
        when(revokedTokenRepository.existsByJti("jti-1")).thenReturn(false);

        authService.logout("refresh-token", "127.0.0.1");

        verify(revokedTokenRepository).save(argThat(token -> token.getJti().equals("jti-1")));
        verify(auditService).record(eq(AuditEventType.LOGOUT), eq("jdoe"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.SUCCESS));
    }

    @Test
    void logoutIsIdempotentForAlreadyInvalidToken() {
        when(jwtService.parseClaims("garbage")).thenThrow(new io.jsonwebtoken.MalformedJwtException("bad"));

        authService.logout("garbage", "127.0.0.1");

        verify(revokedTokenRepository, never()).save(any());
        verify(auditService).record(eq(AuditEventType.LOGOUT), eq("unknown"), anyString(), eq("127.0.0.1"), eq(AuditOutcome.FAILURE));
    }
}
