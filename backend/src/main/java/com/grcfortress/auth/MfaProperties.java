package com.grcfortress.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "grcfortress.mfa")
public class MfaProperties {

    /**
     * SECURITY: development/initial-setup convenience only. Must be disabled
     * before any production / SAMA-audited deployment.
     */
    private boolean bypassEnabled = true;

    private String bypassCode = "123456";

    public boolean isBypassEnabled() {
        return bypassEnabled;
    }

    public void setBypassEnabled(boolean bypassEnabled) {
        this.bypassEnabled = bypassEnabled;
    }

    public String getBypassCode() {
        return bypassCode;
    }

    public void setBypassCode(String bypassCode) {
        this.bypassCode = bypassCode;
    }
}
