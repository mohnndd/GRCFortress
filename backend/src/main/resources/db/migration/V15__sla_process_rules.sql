CREATE TABLE sla_process_rules (
    id                   BIGSERIAL    PRIMARY KEY,
    process_type         VARCHAR(50)  NOT NULL UNIQUE,
    business_days_per_step INT        NOT NULL DEFAULT 5,
    created_at           TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT now(),
    created_by           VARCHAR(64),
    updated_by           VARCHAR(64)
);

INSERT INTO sla_process_rules (process_type, business_days_per_step)
VALUES
    ('POLICY_APPROVAL',    5),
    ('PROCEDURE_APPROVAL', 5),
    ('TERMS_APPROVAL',     5);

ALTER TABLE policy_approval_steps
    ADD COLUMN activated_at TIMESTAMP;

UPDATE policy_approval_steps
SET activated_at = created_at
WHERE status = 'ACTIVE';
