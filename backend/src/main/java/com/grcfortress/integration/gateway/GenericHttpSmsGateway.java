package com.grcfortress.integration.gateway;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Sends SMS via a configurable HTTP webhook, for gateways that don't have a
 * dedicated implementation. Expected settings:
 * <ul>
 *   <li>{@code url} - endpoint to POST to</li>
 *   <li>{@code authHeaderName} / {@code authHeaderValue} (secret) - e.g. "Authorization: Bearer ..."</li>
 *   <li>{@code bodyTemplate} - JSON body with {{to}} and {{message}} placeholders</li>
 * </ul>
 */
@Component
public class GenericHttpSmsGateway implements SmsGateway {

    private final RestClient restClient = RestClient.create();

    @Override
    public String providerKey() {
        return "GENERIC_HTTP";
    }

    @Override
    public void send(Map<String, String> settings, String to, String message) {
        String url = settings.get("url");
        String bodyTemplate = settings.getOrDefault("bodyTemplate", "{\"to\":\"{{to}}\",\"message\":\"{{message}}\"}");

        String body = bodyTemplate
                .replace("{{to}}", escapeJson(to))
                .replace("{{message}}", escapeJson(message));

        RestClient.RequestBodySpec request = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON);

        String authHeaderName = settings.get("authHeaderName");
        String authHeaderValue = settings.get("authHeaderValue");
        if (authHeaderName != null && !authHeaderName.isBlank() && authHeaderValue != null) {
            request.header(authHeaderName, authHeaderValue);
        }

        request.body(body)
                .retrieve()
                .toBodilessEntity();
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
