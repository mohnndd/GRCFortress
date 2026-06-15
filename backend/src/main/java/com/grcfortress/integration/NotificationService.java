package com.grcfortress.integration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.grcfortress.common.crypto.EncryptionService;
import com.grcfortress.integration.gateway.EmailGateway;
import com.grcfortress.integration.gateway.SmsGateway;

/**
 * Sends email/SMS notifications using the gateway and credentials currently
 * configured by an administrator (see {@link IntegrationSettingService}).
 * Throws {@link IntegrationNotConfiguredException} if the relevant
 * integration is disabled or not yet configured.
 */
@Service
public class NotificationService {

    private final IntegrationSettingRepository integrationSettingRepository;
    private final EncryptionService encryptionService;
    private final Map<String, EmailGateway> emailGateways;
    private final Map<String, SmsGateway> smsGateways;

    public NotificationService(IntegrationSettingRepository integrationSettingRepository,
                                EncryptionService encryptionService,
                                List<EmailGateway> emailGateways,
                                List<SmsGateway> smsGateways) {
        this.integrationSettingRepository = integrationSettingRepository;
        this.encryptionService = encryptionService;
        this.emailGateways = emailGateways.stream()
                .collect(java.util.stream.Collectors.toMap(EmailGateway::providerKey, g -> g));
        this.smsGateways = smsGateways.stream()
                .collect(java.util.stream.Collectors.toMap(SmsGateway::providerKey, g -> g));
    }

    public void sendEmail(String to, String subject, String body) {
        IntegrationSetting setting = requireEnabled(IntegrationType.EMAIL);
        EmailGateway gateway = emailGateways.get(setting.getProvider());
        if (gateway == null) {
            throw new IntegrationNotConfiguredException("Unknown email provider: " + setting.getProvider());
        }
        gateway.send(resolveSettings(setting), to, subject, body);
    }

    public void sendSms(String to, String message) {
        IntegrationSetting setting = requireEnabled(IntegrationType.SMS);
        SmsGateway gateway = smsGateways.get(setting.getProvider());
        if (gateway == null) {
            throw new IntegrationNotConfiguredException("Unknown SMS provider: " + setting.getProvider());
        }
        gateway.send(resolveSettings(setting), to, message);
    }

    private IntegrationSetting requireEnabled(IntegrationType type) {
        IntegrationSetting setting = integrationSettingRepository.findByType(type)
                .orElseThrow(() -> new IntegrationNotConfiguredException(type + " integration is not configured"));
        if (!setting.isEnabled()) {
            throw new IntegrationNotConfiguredException(type + " integration is disabled");
        }
        return setting;
    }

    private Map<String, String> resolveSettings(IntegrationSetting setting) {
        Map<String, String> resolved = new HashMap<>(setting.getConfig());
        if (setting.hasSecrets()) {
            resolved.putAll(IntegrationSettingService.decryptSecrets(setting.getSecrets(), encryptionService));
        }
        return resolved;
    }
}
