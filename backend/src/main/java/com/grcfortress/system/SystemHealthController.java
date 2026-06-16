package com.grcfortress.system;

import java.time.Instant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.system.dto.SystemHealthResponse;

@RestController
@RequestMapping("/api/v1/system")
public class SystemHealthController {

    private final JdbcTemplate jdbcTemplate;

    public SystemHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public SystemHealthResponse health() {
        String databaseStatus = "DOWN";
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (Integer.valueOf(1).equals(result)) {
                databaseStatus = "UP";
            }
        } catch (RuntimeException ignored) {
            databaseStatus = "DOWN";
        }
        return new SystemHealthResponse("UP", databaseStatus, Instant.now());
    }
}
