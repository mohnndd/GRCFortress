package com.grcfortress.integration;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.integration.dto.IntegrationSettingRequest;
import com.grcfortress.integration.dto.IntegrationSettingResponse;
import com.grcfortress.integration.dto.TestEmailRequest;
import com.grcfortress.integration.dto.TestSmsRequest;

/**
 * Admin-only endpoints for configuring outbound email/SMS integrations
 * (gateway provider, connection settings, and credentials) without code
 * changes.
 */
@RestController
@RequestMapping("/api/v1/admin/integrations")
@PreAuthorize("hasRole('ADMIN')")
public class IntegrationAdminController {

    private final IntegrationSettingService integrationSettingService;

    public IntegrationAdminController(IntegrationSettingService integrationSettingService) {
        this.integrationSettingService = integrationSettingService;
    }

    @GetMapping("/email")
    public IntegrationSettingResponse getEmail() {
        return integrationSettingService.get(IntegrationType.EMAIL);
    }

    @PutMapping("/email")
    public IntegrationSettingResponse updateEmail(@Valid @RequestBody IntegrationSettingRequest request) {
        return integrationSettingService.update(IntegrationType.EMAIL, request);
    }

    @PostMapping("/email/test")
    public void testEmail(@Valid @RequestBody TestEmailRequest request) {
        integrationSettingService.sendTestEmail(request.to());
    }

    @GetMapping("/sms")
    public IntegrationSettingResponse getSms() {
        return integrationSettingService.get(IntegrationType.SMS);
    }

    @PutMapping("/sms")
    public IntegrationSettingResponse updateSms(@Valid @RequestBody IntegrationSettingRequest request) {
        return integrationSettingService.update(IntegrationType.SMS, request);
    }

    @PostMapping("/sms/test")
    public void testSms(@Valid @RequestBody TestSmsRequest request) {
        integrationSettingService.sendTestSms(request.to());
    }
}
