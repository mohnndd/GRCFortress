package com.grcfortress.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    record UserDto(
            Long id,
            String username,
            String email,
            String fullName,
            boolean enabled,
            boolean accountLocked,
            boolean mfaEnabled,
            int failedLoginAttempts,
            Instant lastLoginAt,
            List<String> roles
    ) {}

    record CreateUserRequest(
            String username,
            String email,
            String fullName,
            String password,
            boolean mfaEnabled,
            List<Long> roleIds
    ) {}

    record UpdateUserRequest(
            String email,
            String fullName,
            boolean enabled,
            boolean accountLocked,
            boolean mfaEnabled,
            List<Long> roleIds
    ) {}

    record ResetPasswordRequest(String newPassword) {}

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserDto> listUsers() {
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> ResponseEntity.ok(toDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest req) {
        if (userRepository.existsByUsernameIgnoreCase(req.username())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        User user = new User(
                req.username().trim(),
                req.email().trim(),
                req.fullName().trim(),
                passwordEncoder.encode(req.password()),
                req.mfaEnabled()
        );

        if (req.roleIds() != null && !req.roleIds().isEmpty()) {
            List<Role> roles = roleRepository.findAllById(req.roleIds());
            roles.forEach(user::addRole);
        }

        return ResponseEntity.ok(toDto(userRepository.save(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (!user.getEmail().equalsIgnoreCase(req.email()) &&
                userRepository.existsByEmailIgnoreCase(req.email())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        user.setEmail(req.email().trim());
        user.setFullName(req.fullName().trim());
        user.setEnabled(req.enabled());
        user.setAccountLocked(req.accountLocked());
        user.setMfaEnabled(req.mfaEnabled());

        user.getRoles().clear();
        if (req.roleIds() != null && !req.roleIds().isEmpty()) {
            List<Role> roles = roleRepository.findAllById(req.roleIds());
            roles.forEach(user::addRole);
        }

        return ResponseEntity.ok(toDto(userRepository.save(user)));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
                                               @RequestBody ResetPasswordRequest req) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<UserDto> unlockUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        return ResponseEntity.ok(toDto(userRepository.save(user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UserDto toDto(User u) {
        List<String> roles = u.getRoles().stream().map(Role::getName).sorted().toList();
        return new UserDto(
                u.getId(), u.getUsername(), u.getEmail(), u.getFullName(),
                u.isEnabled(), u.isAccountLocked(), u.isMfaEnabled(),
                u.getFailedLoginAttempts(), u.getLastLoginAt(), roles
        );
    }
}
