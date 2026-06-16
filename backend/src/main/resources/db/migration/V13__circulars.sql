CREATE SEQUENCE circulars_number_seq START 1;

CREATE TABLE circulars (
    id                         BIGSERIAL     PRIMARY KEY,
    circular_number            VARCHAR(20)   NOT NULL UNIQUE,
    issuer                     VARCHAR(255)  NOT NULL,
    description                TEXT          NOT NULL,
    department_id              BIGINT        REFERENCES departments(id) ON DELETE SET NULL,
    attachment_file_name       VARCHAR(500),
    attachment_file_path       VARCHAR(1000),
    attachment_file_type       VARCHAR(20),
    attachment_file_size_bytes BIGINT,
    created_at                 TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMP     NOT NULL DEFAULT now(),
    created_by                 VARCHAR(64),
    updated_by                 VARCHAR(64)
);

CREATE INDEX idx_circulars_department ON circulars(department_id);
CREATE INDEX idx_circulars_created_at ON circulars(created_at);
