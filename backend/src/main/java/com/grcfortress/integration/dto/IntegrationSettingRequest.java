package com.grcfortress.integration.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

/**
 * Update payload for an integration's configuration.
 * <p>
 * {@code secrets}, when present, fully replaces the stored credential map
 * (each value is encrypted at rest). Omit {@code secrets} (or pass
 * {@code null}) to leave previously stored credentials unchanged - e.g. when
 * an admin only wants to toggle {@code enabled} or tweak non-secret config.
 */
public record IntegrationSettingRequest(
        @NotBlank String provider,
        boolean enabled,
        Map<String, String> config,
        Map<String, String> secrets
) {
}
