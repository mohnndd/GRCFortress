package com.grcfortress.integration.gateway;

import java.util.Map;

/**
 * Sends an email using the given resolved configuration (non-secret
 * {@code config} merged with decrypted {@code secrets}).
 */
public interface EmailGateway {

    /** Provider identifier matched against {@code integration_settings.provider}. */
    String providerKey();

    void send(Map<String, String> settings, String to, String subject, String body);
}
