# Admin-Configurable Integrations (Email / SMS)

GRC Fortress lets an `ADMIN` configure outbound **email** and **SMS**
gateways entirely at runtime — no code changes or redeploys needed to point
a deployment at a customer's own SMTP server, Twilio account, or other HTTP
SMS provider.

## Data model

`integration_settings` table (`V2__integration_settings.sql`), one row per
`IntegrationType` (`EMAIL`, `SMS`):

| Column | Purpose |
|---|---|
| `type` | `EMAIL` or `SMS` (unique) |
| `provider` | Which gateway implementation to use, e.g. `SMTP`, `TWILIO`, `GENERIC_HTTP` |
| `enabled` | Whether this integration is active |
| `config` | JSONB — non-secret settings (host, port, from address, URL templates, etc.) |
| `secrets` | TEXT — AES-256-GCM encrypted (base64), JSON-serialized map of credential fields (passwords, API tokens). Never returned by the API. |

`IntegrationSetting` entity maps this; `secrets` is encrypted/decrypted via
`EncryptionService` (`grcfortress.security.encryption.key`, AES-256, base64,
overridable via `ENCRYPTION_KEY` — see [deployment.md](deployment.md)).

## API (`/api/v1/admin/integrations`, requires `ROLE_ADMIN`)

| Endpoint | Purpose |
|---|---|
| `GET /email`, `GET /sms` | Current config. Returns `provider`, `enabled`, `config`, and `hasSecrets` (boolean) — actual secret values are never returned. |
| `PUT /email`, `PUT /sms` | Update provider/enabled/config, and optionally replace `secrets` (a flat map of credential field → value). Omit `secrets` (or send `null`) to keep existing credentials unchanged. |
| `POST /email/test`, `POST /sms/test` | Send a test message to a given address/number using the currently saved configuration. |

## Gateway provider pattern

Two interfaces in `com.grcfortress.integration.gateway`:

```java
public interface EmailGateway {
    String providerKey();   // matches integration_settings.provider
    void send(Map<String, String> settings, String to, String subject, String body);
}

public interface SmsGateway {
    String providerKey();
    void send(Map<String, String> settings, String to, String message);
}
```

`settings` is `config` merged with the decrypted `secrets` map.
`NotificationService` looks up the enabled `IntegrationSetting` for
`EMAIL`/`SMS`, resolves `settings`, and dispatches to the `@Component` whose
`providerKey()` matches `provider`.

### Built-in providers

- **`SmtpEmailGateway`** (`SMTP`) — generic SMTP. Settings: `host`, `port`,
  `username`, `password` (secret), `starttls`, `fromAddress`.
- **`GenericHttpSmsGateway`** (`GENERIC_HTTP`) — POSTs a JSON body to a
  configurable webhook. Settings: `url`, `bodyTemplate` (with `{{to}}` /
  `{{message}}` placeholders), `authHeaderName` / `authHeaderValue` (secret).
  Use this for SMS providers without a dedicated implementation.
- **`TwilioSmsGateway`** (`TWILIO`) — Twilio REST API. Settings:
  `accountSid`, `fromNumber`, `authToken` (secret).

### Adding a new provider

1. Implement `EmailGateway` or `SmsGateway` as a `@Component`, choose a
   unique `providerKey()`.
2. Document its expected `config`/`secrets` keys in a class-level comment
   (the admin UI/API consumer needs to know what fields to send).
3. No controller or service changes needed — `NotificationService` and
   `IntegrationSettingService` discover gateways via Spring's
   `List<EmailGateway>` / `List<SmsGateway>` injection and validate
   `provider` against the known `providerKey()`s automatically.

## Sending notifications from other modules

Inject `NotificationService` and call `sendEmail(to, subject, body)` /
`sendSms(to, message)`. These throw `IntegrationNotConfiguredException`
(→ HTTP 409) if the relevant integration is disabled or not configured —
callers (e.g. an attestation reminder job) should handle this gracefully
(log + skip) rather than failing the whole operation.
