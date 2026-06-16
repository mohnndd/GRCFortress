CREATE TABLE authority_delegations (
    id                   BIGSERIAL    PRIMARY KEY,
    delegator_username   VARCHAR(64)  NOT NULL,
    delegate_username    VARCHAR(64)  NOT NULL,
    reason               TEXT,
    valid_from           DATE         NOT NULL DEFAULT CURRENT_DATE,
    valid_until          DATE,
    is_active            BOOLEAN      NOT NULL DEFAULT true,
    created_at           TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT now(),
    created_by           VARCHAR(64),
    updated_by           VARCHAR(64)
);

CREATE INDEX idx_delegations_delegator ON authority_delegations(delegator_username);
CREATE INDEX idx_delegations_delegate  ON authority_delegations(delegate_username);
