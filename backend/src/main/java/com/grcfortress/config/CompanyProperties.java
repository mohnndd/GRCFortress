package com.grcfortress.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Organization-wide settings. {@code emailDomain} is enforced as the suffix
 * for all stakeholder email addresses so that every communication routes
 * through the company's domain (e.g. "cto" -> "cto@grcfortress.local").
 */
@ConfigurationProperties(prefix = "grcfortress.company")
public class CompanyProperties {

    private String emailDomain;

    public String getEmailDomain() {
        return emailDomain;
    }

    public void setEmailDomain(String emailDomain) {
        this.emailDomain = emailDomain;
    }
}
