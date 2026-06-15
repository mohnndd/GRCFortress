package com.grcfortress.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "grcfortress.security.encryption")
public class EncryptionProperties {

    /**
     * Base64-encoded 256-bit AES key used to encrypt secrets (integration
     * credentials, etc.) at rest. MUST be overridden with a unique value
     * per deployment via the ENCRYPTION_KEY environment variable.
     */
    private String key;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
