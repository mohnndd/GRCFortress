package com.grcfortress.user;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.common.audit.AuditEventType;
import com.grcfortress.common.audit.AuditOutcome;
import com.grcfortress.common.audit.AuditService;
import com.grcfortress.integration.NotificationService;
import com.grcfortress.user.dto.CreateUserRequest;
import com.grcfortress.user.dto.UserSummary;

/**
 * Admin-only user provisioning: creating accounts, resetting passwords and
 * unlocking accounts. Generated passwords are emailed directly to the
 * affected user and are never returned to the caller or logged — if the
 * email integration isn't configured, the whole operation is rolled back
 * rather than leaving a password unreachable by anyone.
 */
@Service
@Transactional
public class UserAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGenerator passwordGenerator;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public UserAdminService(UserRepository userRepository,
                             RoleRepository roleRepository,
                             PasswordEncoder passwordEncoder,
                             PasswordGenerator passwordGenerator,
                             NotificationService notificationService,
                             AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordGenerator = passwordGenerator;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<UserSummary> listUsers() {
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .map(this::toSummary)
                .toList();
    }

    public UserSummary createUser(CreateUserRequest request, String actingAdmin, String ipAddress) {
        String username = request.username().strip();
        String email = request.email().strip().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already in use");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email '" + email + "' is already in use");
        }

        Set<Role> roles = resolveRoles(request.roles());

        String temporaryPassword = passwordGenerator.generate();
        User user = new User(username, email, request.fullName().strip(),
                passwordEncoder.encode(temporaryPassword), request.mfaEnabled());
        user.setMustChangePassword(true);
        roles.forEach(user::addRole);
        userRepository.save(user);

        sendCredentialsEmail(email, username, temporaryPassword, "Your GRC Fortress account has been created");
        auditService.record(AuditEventType.USER_CREATED, actingAdmin, "Created user '" + username + "'", ipAddress, AuditOutcome.SUCCESS);

        return toSummary(user);
    }

    public UserSummary resetPassword(Long userId, String actingAdmin, String ipAddress) {
        User user = requireUser(userId);

        String temporaryPassword = passwordGenerator.generate();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        sendCredentialsEmail(user.getEmail(), user.getUsername(), temporaryPassword, "Your GRC Fortress password has been reset");
        auditService.record(AuditEventType.PASSWORD_RESET, actingAdmin, "Reset password for user '" + user.getUsername() + "'", ipAddress, AuditOutcome.SUCCESS);

        return toSummary(user);
    }

    public UserSummary unlockUser(Long userId, String actingAdmin, String ipAddress) {
        User user = requireUser(userId);

        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        auditService.record(AuditEventType.ACCOUNT_UNLOCKED, actingAdmin, "Unlocked user '" + user.getUsername() + "'", ipAddress, AuditOutcome.SUCCESS);

        return toSummary(user);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        return roleNames.stream()
                .map(name -> roleRepository.findByName(name)
                        .orElseThrow(() -> new IllegalArgumentException("Unknown role: " + name)))
                .collect(Collectors.toSet());
    }

    private void sendCredentialsEmail(String to, String username, String temporaryPassword, String subject) {
        String body = "Hello,\n\n"
                + "An account has been provisioned for you on GRC Fortress.\n\n"
                + "Username: " + username + "\n"
                + "Temporary password: " + temporaryPassword + "\n\n"
                + "You will be required to set a new password the first time you sign in.\n"
                + "If you did not expect this email, please contact your administrator.\n";
        notificationService.sendEmail(to, subject, body);
    }

    private UserSummary toSummary(User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return new UserSummary(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.isMfaEnabled(),
                user.isEnabled(),
                user.isAccountLocked(),
                user.isMustChangePassword(),
                user.getLastLoginAt());
    }
}
