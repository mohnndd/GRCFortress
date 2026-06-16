package com.grcfortress.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.user.Role;
import com.grcfortress.user.RoleName;
import com.grcfortress.user.RoleRepository;
import com.grcfortress.user.User;
import com.grcfortress.user.UserRepository;

/**
 * Ensures a default ADMIN account exists on first startup so the system can
 * be administered out of the box. Credentials are configurable via
 * {@code grcfortress.security.default-admin.*} and SHOULD be rotated
 * immediately after first login in any non-development environment.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultAdminProperties defaultAdminProperties;

    public DataSeeder(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       DefaultAdminProperties defaultAdminProperties) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultAdminProperties = defaultAdminProperties;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role missing - check Flyway migrations"));

        userRepository.findByUsernameIgnoreCase(defaultAdminProperties.getUsername())
                .ifPresentOrElse(
                        existing -> {
                            existing.setPasswordHash(passwordEncoder.encode(defaultAdminProperties.getPassword()));
                            userRepository.save(existing);
                        },
                        () -> {
                            User admin = new User(
                                    defaultAdminProperties.getUsername(),
                                    defaultAdminProperties.getEmail(),
                                    "System Administrator",
                                    passwordEncoder.encode(defaultAdminProperties.getPassword()),
                                    true);
                            admin.addRole(adminRole);
                            userRepository.save(admin);
                        });
    }
}
