CREATE TABLE policies (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    policy_number   VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    category        VARCHAR(200),
    status          VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    current_version_id BIGINT,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      VARCHAR(64),
    updated_by      VARCHAR(64)
);

CREATE TABLE policy_versions (
    id                          BIGSERIAL PRIMARY KEY,
    policy_id                   BIGINT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    version_number              VARCHAR(50)  NOT NULL,
    file_name                   VARCHAR(500) NOT NULL,
    file_path                   VARCHAR(1000) NOT NULL,
    file_type                   VARCHAR(10)  NOT NULL,
    file_size_bytes             BIGINT,
    change_reason               TEXT NOT NULL,
    change_summary              TEXT,
    previous_version_id         BIGINT REFERENCES policy_versions(id),
    status                      VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    pre_approval_required       BOOLEAN NOT NULL DEFAULT FALSE,
    pre_approval_stakeholder_id BIGINT REFERENCES department_stakeholders(id),
    pre_approval_status         VARCHAR(50),
    pre_approval_comments       TEXT,
    pre_approval_decided_at     TIMESTAMP,
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT now(),
    created_by                  VARCHAR(64),
    updated_by                  VARCHAR(64)
);

CREATE INDEX idx_policy_versions_policy_id ON policy_versions(policy_id);

CREATE TABLE policy_approval_cycles (
    id                  BIGSERIAL PRIMARY KEY,
    policy_version_id   BIGINT NOT NULL UNIQUE REFERENCES policy_versions(id) ON DELETE CASCADE,
    status              VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    current_step_order  INT NOT NULL DEFAULT 1,
    initiated_at        TIMESTAMP NOT NULL DEFAULT now(),
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64)
);

CREATE TABLE policy_approval_steps (
    id                          BIGSERIAL PRIMARY KEY,
    cycle_id                    BIGINT NOT NULL REFERENCES policy_approval_cycles(id) ON DELETE CASCADE,
    department_id               BIGINT NOT NULL REFERENCES departments(id),
    step_order                  INT NOT NULL,
    assigned_to_stakeholder_id  BIGINT REFERENCES department_stakeholders(id),
    delegated_to_stakeholder_id BIGINT REFERENCES department_stakeholders(id),
    status                      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    decision                    VARCHAR(50),
    comments                    TEXT,
    decided_at                  TIMESTAMP,
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT now(),
    created_by                  VARCHAR(64),
    updated_by                  VARCHAR(64)
);

CREATE INDEX idx_approval_steps_cycle_id ON policy_approval_steps(cycle_id);
CREATE INDEX idx_approval_steps_assigned ON policy_approval_steps(assigned_to_stakeholder_id);

CREATE TABLE policy_step_messages (
    id              BIGSERIAL PRIMARY KEY,
    step_id         BIGINT NOT NULL REFERENCES policy_approval_steps(id) ON DELETE CASCADE,
    author_username VARCHAR(64)  NOT NULL,
    author_name     VARCHAR(200),
    message         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_step_messages_step_id ON policy_step_messages(step_id);
