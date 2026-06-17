CREATE TABLE policy_acknowledgements (
    id              BIGSERIAL   PRIMARY KEY,
    policy_id       BIGINT      NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    version_number  VARCHAR(20),
    username        VARCHAR(64) NOT NULL,
    full_name       VARCHAR(200),
    acknowledged_at TIMESTAMP   NOT NULL DEFAULT now(),
    UNIQUE (policy_id, username)
);

CREATE INDEX idx_policy_ack_policy   ON policy_acknowledgements(policy_id);
CREATE INDEX idx_policy_ack_username ON policy_acknowledgements(username);
