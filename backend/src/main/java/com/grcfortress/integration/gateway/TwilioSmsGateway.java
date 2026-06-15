package com.grcfortress.integration.gateway;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/**
 * Sends SMS via the Twilio REST API. Expected settings:
 * <ul>
 *   <li>{@code accountSid} - Twilio Account SID</li>
 *   <li>{@code fromNumber} - Twilio sending number</li>
 *   <li>{@code authToken} (secret) - Twilio Auth Token</li>
 * </ul>
 */
@Component
public class TwilioSmsGateway implements SmsGateway {

    private static final String API_URL_TEMPLATE = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";

    private final RestClient restClient = RestClient.create();

    @Override
    public String providerKey() {
        return "TWILIO";
    }

    @Override
    public void send(Map<String, String> settings, String to, String message) {
        String accountSid = settings.get("accountSid");
        String authToken = settings.get("authToken");
        String fromNumber = settings.get("fromNumber");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("From", fromNumber);
        form.add("To", to);
        form.add("Body", message);

        restClient.post()
                .uri(API_URL_TEMPLATE.formatted(accountSid))
                .headers(headers -> headers.setBasicAuth(accountSid, authToken))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .toBodilessEntity();
    }
}
