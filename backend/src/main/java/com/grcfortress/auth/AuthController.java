package com.grcfortress.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.auth.dto.CurrentUserResponse;
import com.grcfortress.auth.dto.LoginRequest;
import com.grcfortress.auth.dto.LoginResponse;
import com.grcfortress.auth.dto.MfaVerifyRequest;
import com.grcfortress.auth.dto.RefreshRequest;
import com.grcfortress.auth.dto.TokenResponse;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Login, MFA verification and token lifecycle")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with username/password (step 1 of 2)")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return authService.login(request.username(), request.password(), clientIp(httpRequest));
    }

    @PostMapping("/mfa/verify")
    @Operation(summary = "Verify the MFA code issued during login (step 2 of 2)")
    public TokenResponse verifyMfa(@Valid @RequestBody MfaVerifyRequest request, HttpServletRequest httpRequest) {
        return authService.verifyMfa(request.mfaToken(), request.code(), clientIp(httpRequest));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a refresh token for a new access/refresh token pair")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request, HttpServletRequest httpRequest) {
        return authService.refresh(request.refreshToken(), clientIp(httpRequest));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user's profile and roles")
    public CurrentUserResponse currentUser(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
