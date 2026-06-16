package com.grcfortress.user;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.user.dto.CreateUserRequest;
import com.grcfortress.user.dto.UserSummary;

/**
 * Admin-only user provisioning. Generated/reset passwords are emailed
 * directly to the user and are never included in any API response.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User administration", description = "Create users, reset passwords and unlock accounts")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    @Operation(summary = "List all users")
    public List<UserSummary> listUsers() {
        return userAdminService.listUsers();
    }

    @PostMapping
    @Operation(summary = "Create a user with a generated temporary password, emailed to the user")
    public UserSummary createUser(@Valid @RequestBody CreateUserRequest request,
                                   Authentication authentication,
                                   HttpServletRequest httpRequest) {
        return userAdminService.createUser(request, authentication.getName(), clientIp(httpRequest));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Generate a new temporary password and email it to the user")
    public UserSummary resetPassword(@PathVariable Long id,
                                      Authentication authentication,
                                      HttpServletRequest httpRequest) {
        return userAdminService.resetPassword(id, authentication.getName(), clientIp(httpRequest));
    }

    @PostMapping("/{id}/unlock")
    @Operation(summary = "Unlock an account that was locked after repeated failed login attempts")
    public UserSummary unlockUser(@PathVariable Long id,
                                   Authentication authentication,
                                   HttpServletRequest httpRequest) {
        return userAdminService.unlockUser(id, authentication.getName(), clientIp(httpRequest));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
