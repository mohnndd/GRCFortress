package com.grcfortress.integration.dto;

import java.util.Map;

import com.grcfortress.integration.IntegrationType;

/**
 * Integration configuration returned to admins. {@code secrets} are never
 * returned - {@code secretFieldsSet} only indicates which credential keys
 * currently have a stored value.
 */
public record IntegrationSettingResponse(
        IntegrationType type,
        String provider,
        boolean enabled,
        Map<String, String> config,
        boolean hasSecrets
) {
}
