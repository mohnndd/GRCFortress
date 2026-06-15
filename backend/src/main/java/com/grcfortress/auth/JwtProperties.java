package com.grcfortress.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "grcfortress.jwt")
public class JwtProperties {

    private String secret;
    private long accessTokenTtlMinutes = 30;
    private long refreshTokenTtlDays = 7;
    private long mfaTokenTtlMinutes = 5;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessTokenTtlMinutes() {
        return accessTokenTtlMinutes;
    }

    public void setAccessTokenTtlMinutes(long accessTokenTtlMinutes) {
        this.accessTokenTtlMinutes = accessTokenTtlMinutes;
    }

    public long getRefreshTokenTtlDays() {
        return refreshTokenTtlDays;
    }

    public void setRefreshTokenTtlDays(long refreshTokenTtlDays) {
        this.refreshTokenTtlDays = refreshTokenTtlDays;
    }

    public long getMfaTokenTtlMinutes() {
        return mfaTokenTtlMinutes;
    }

    public void setMfaTokenTtlMinutes(long mfaTokenTtlMinutes) {
        this.mfaTokenTtlMinutes = mfaTokenTtlMinutes;
    }
}
