-- Denylist for revoked refresh tokens (logout, and rotation on every
-- successful /api/v1/auth/refresh call). Refresh tokens are otherwise
-- stateless JWTs with no server-side way to invalidate one before it
-- expires.

CREATE TABLE revoked_token (
    id          BIGSERIAL PRIMARY KEY,
    jti         VARCHAR(36) NOT NULL UNIQUE,
    revoked_at  TIMESTAMP   NOT NULL DEFAULT now(),
    expires_at  TIMESTAMP   NOT NULL
);

CREATE INDEX idx_revoked_token_expires_at ON revoked_token(expires_at);
