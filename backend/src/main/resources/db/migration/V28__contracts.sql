CREATE TABLE contracts (
    id               BIGSERIAL     PRIMARY KEY,
    contract_number  VARCHAR(50)   NOT NULL UNIQUE,
    title            VARCHAR(300)  NOT NULL,
    counterparty     VARCHAR(200)  NOT NULL,
    contract_type    VARCHAR(50)   NOT NULL DEFAULT 'SERVICE',
    department_owner VARCHAR(200)  NOT NULL,
    value            NUMERIC(18,2),
    currency         VARCHAR(10)   NOT NULL DEFAULT 'SAR',
    start_date       DATE,
    end_date         DATE,
    renewal_date     DATE,
    status           VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE',
    description      TEXT,
    attachment_path  VARCHAR(500),
    attachment_name  VARCHAR(255),
    uuid             UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    created_by       VARCHAR(64),
    updated_by       VARCHAR(64)
);

CREATE INDEX idx_contracts_status   ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
