package com.grcfortress.integration.gateway;

import java.util.Map;

/**
 * Sends an SMS using the given resolved configuration (non-secret
 * {@code config} merged with decrypted {@code secrets}).
 */
public interface SmsGateway {

    /** Provider identifier matched against {@code integration_settings.provider}. */
    String providerKey();

    void send(Map<String, String> settings, String to, String message);
}
