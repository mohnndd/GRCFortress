package com.grcfortress.integration;

import java.util.HashMap;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Admin-configurable outbound integration (email / SMS gateway). Non-secret
 * settings live in {@code config}; credentials live AES-GCM encrypted in
 * {@code secrets} (see {@link com.grcfortress.common.crypto.EncryptionService}).
 */
@Entity
@Table(name = "integration_settings")
public class IntegrationSetting extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, unique = true, length = 32)
    private IntegrationType type;

    @Column(name = "provider", nullable = false, length = 64)
    private String provider;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", nullable = false)
    private Map<String, String> config = new HashMap<>();

    /** Base64 AES-GCM encrypted JSON map of credential fields, or null if none set. */
    @Column(name = "secrets")
    private String secrets;

    protected IntegrationSetting() {
    }

    public IntegrationSetting(IntegrationType type, String provider) {
        this.type = type;
        this.provider = provider;
    }

    public Long getId() {
        return id;
    }

    public IntegrationType getType() {
        return type;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Map<String, String> getConfig() {
        return config;
    }

    public void setConfig(Map<String, String> config) {
        this.config = config;
    }

    public String getSecrets() {
        return secrets;
    }

    public void setSecrets(String secrets) {
        this.secrets = secrets;
    }

    public boolean hasSecrets() {
        return secrets != null && !secrets.isBlank();
    }
}
