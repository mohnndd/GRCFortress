-- Admin-configurable outbound integration settings (email / SMS gateways).
-- Sensitive values (API keys, passwords, tokens) are stored AES-GCM encrypted
-- in `secrets`; non-sensitive settings are stored in plain `config`.

CREATE TABLE integration_settings (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(32)  NOT NULL UNIQUE, -- e.g. EMAIL, SMS
    provider    VARCHAR(64)  NOT NULL,        -- e.g. SMTP, TWILIO, GENERIC_HTTP
    enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
    config      JSONB        NOT NULL DEFAULT '{}'::jsonb,
    secrets     TEXT,                         -- AES-GCM encrypted JSON blob (base64), null if no secrets set
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    created_by  VARCHAR(64),
    updated_by  VARCHAR(64)
);
