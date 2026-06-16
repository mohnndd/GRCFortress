package com.grcfortress.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Kept separate from {@code GrcFortressApplication} so that {@code @EnableJpaAuditing}
 * (which needs a fully initialized JPA metamodel) is only activated for contexts that
 * actually load JPA - not for web slice tests like {@code @WebMvcTest}, which treat the
 * application's {@code @SpringBootConfiguration} class as always-on regardless of
 * component-scan exclude filters.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditingConfig {
}
