-- Role permission assignments: maps roles to API endpoint patterns
-- Informational + enforcement layer for custom roles beyond USER/ADMIN

ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;
UPDATE roles SET is_system = true WHERE name IN ('USER', 'ADMIN');

CREATE TABLE role_permissions (
    id             BIGSERIAL    PRIMARY KEY,
    role_id        BIGINT       NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    http_method    VARCHAR(10)  NOT NULL DEFAULT 'ANY',
    path_pattern   VARCHAR(300) NOT NULL,
    label          VARCHAR(200),
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    created_by     VARCHAR(64),
    UNIQUE(role_id, http_method, path_pattern)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
