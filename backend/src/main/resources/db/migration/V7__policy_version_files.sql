-- Allow multiple files per policy version
ALTER TABLE policy_versions ALTER COLUMN file_name  DROP NOT NULL;
ALTER TABLE policy_versions ALTER COLUMN file_path  DROP NOT NULL;
ALTER TABLE policy_versions ALTER COLUMN file_type  DROP NOT NULL;

CREATE TABLE policy_version_files (
    id              BIGSERIAL PRIMARY KEY,
    version_id      BIGINT       NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
    file_name       VARCHAR(500) NOT NULL,
    file_path       VARCHAR(1000) NOT NULL,
    file_type       VARCHAR(10)  NOT NULL,
    file_size_bytes BIGINT,
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_pvf_version_id ON policy_version_files(version_id);
