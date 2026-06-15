-- Core identity & RBAC schema for GRC Fortress

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(64)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    mfa_enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    mfa_secret      VARCHAR(255),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    account_locked  BOOLEAN      NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now(),
    created_by      VARCHAR(64),
    updated_by      VARCHAR(64)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    event_type  VARCHAR(64)  NOT NULL,
    username    VARCHAR(64),
    detail      VARCHAR(1000),
    ip_address  VARCHAR(64),
    outcome     VARCHAR(16)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_username   ON audit_log(username);

-- Baseline RBAC roles for the GRC domain
INSERT INTO roles (name, description) VALUES
    ('ADMIN',              'Full system administration access'),
    ('COMPLIANCE_OFFICER', 'Manages policies, procedures and compliance activities'),
    ('AUDITOR',            'Read-only access for audit and assurance purposes'),
    ('REVIEWER',           'Reviews and approves policies, procedures and decisions'),
    ('EMPLOYEE',           'General staff member - acknowledgements and attestations');
