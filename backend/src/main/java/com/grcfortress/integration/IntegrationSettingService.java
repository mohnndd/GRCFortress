package com.grcfortress.integration;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grcfortress.common.crypto.EncryptionService;
import com.grcfortress.integration.dto.IntegrationSettingRequest;
import com.grcfortress.integration.dto.IntegrationSettingResponse;
import com.grcfortress.integration.gateway.EmailGateway;
import com.grcfortress.integration.gateway.SmsGateway;

import java.util.List;

/**
 * Manages admin-configured email/SMS integration settings, including
 * encryption of credential fields and dispatch of test messages.
 */
@Service
public class IntegrationSettingService {

    private final IntegrationSettingRepository integrationSettingRepository;
    private final EncryptionService encryptionService;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final Map<String, EmailGateway> emailGateways;
    private final Map<String, SmsGateway> smsGateways;

    public IntegrationSettingService(IntegrationSettingRepository integrationSettingRepository,
                                      EncryptionService encryptionService,
                                      ObjectMapper objectMapper,
                                      NotificationService notificationService,
                                      List<EmailGateway> emailGateways,
                                      List<SmsGateway> smsGateways) {
        this.integrationSettingRepository = integrationSettingRepository;
        this.encryptionService = encryptionService;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.emailGateways = emailGateways.stream()
                .collect(java.util.stream.Collectors.toMap(EmailGateway::providerKey, g -> g));
        this.smsGateways = smsGateways.stream()
                .collect(java.util.stream.Collectors.toMap(SmsGateway::providerKey, g -> g));
    }

    @Transactional(readOnly = true)
    public IntegrationSettingResponse get(IntegrationType type) {
        return integrationSettingRepository.findByType(type)
                .map(this::toResponse)
                .orElseGet(() -> new IntegrationSettingResponse(type, "", false, Map.of(), false));
    }

    @Transactional
    public IntegrationSettingResponse update(IntegrationType type, IntegrationSettingRequest request) {
        if (type == IntegrationType.EMAIL && !emailGateways.containsKey(request.provider())) {
            throw new IllegalArgumentException("Unknown email provider: " + request.provider());
        }
        if (type == IntegrationType.SMS && !smsGateways.containsKey(request.provider())) {
            throw new IllegalArgumentException("Unknown SMS provider: " + request.provider());
        }

        IntegrationSetting setting = integrationSettingRepository.findByType(type)
                .orElseGet(() -> new IntegrationSetting(type, request.provider()));

        setting.setProvider(request.provider());
        setting.setEnabled(request.enabled());
        setting.setConfig(request.config() != null ? request.config() : new HashMap<>());

        if (request.secrets() != null) {
            setting.setSecrets(encryptSecrets(request.secrets()));
        }

        return toResponse(integrationSettingRepository.save(setting));
    }

    public void sendTestEmail(String to) {
        notificationService.sendEmail(to, "GRC Fortress test email",
                "This is a test message confirming your email integration is configured correctly.");
    }

    public void sendTestSms(String to) {
        notificationService.sendSms(to,
                "GRC Fortress: this is a test message confirming your SMS integration is configured correctly.");
    }

    private IntegrationSettingResponse toResponse(IntegrationSetting setting) {
        return new IntegrationSettingResponse(
                setting.getType(),
                setting.getProvider(),
                setting.isEnabled(),
                setting.getConfig(),
                setting.hasSecrets()
        );
    }

    private String encryptSecrets(Map<String, String> secrets) {
        try {
            String json = objectMapper.writeValueAsString(secrets);
            return encryptionService.encrypt(json);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize integration secrets", ex);
        }
    }

    /** Decrypts a stored secrets blob back into its credential map. */
    static Map<String, String> decryptSecrets(String encrypted, EncryptionService encryptionService) {
        try {
            String json = encryptionService.decrypt(encrypted);
            return new ObjectMapper().readValue(json, new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {
            });
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to decrypt integration secrets", ex);
        }
    }
}
