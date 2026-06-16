package com.grcfortress.user;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.grcfortress.auth.JwtAuthenticationFilter;
import com.grcfortress.config.SecurityConfig;

/**
 * Verifies {@code @PreAuthorize("hasRole('ADMIN')")} actually gates
 * {@code /api/v1/admin/users} - i.e. that RBAC, not just authentication, is
 * enforced on admin-only endpoints. The production {@link SecurityConfig} and
 * {@link JwtAuthenticationFilter} are excluded since they pull in beans
 * (JwtService, UserDetailsService) that this slice doesn't provide; method
 * security alone is enough to verify {@code @PreAuthorize} with
 * {@code @WithMockUser}.
 */
@WebMvcTest(controllers = UserAdminController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = { SecurityConfig.class, JwtAuthenticationFilter.class }))
@Import(UserAdminControllerRbacTest.MethodSecurityTestConfig.class)
class UserAdminControllerRbacTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserAdminService userAdminService;

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityTestConfig {
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanListUsers() throws Exception {
        when(userAdminService.listUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void nonAdminIsForbiddenFromListingUsers() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());
    }
}
