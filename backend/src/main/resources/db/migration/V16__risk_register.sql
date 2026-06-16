CREATE TABLE risk_domains (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    created_by  VARCHAR(64),
    updated_by  VARCHAR(64)
);

CREATE TABLE risk_categories (
    id          BIGSERIAL    PRIMARY KEY,
    domain_id   BIGINT       NOT NULL REFERENCES risk_domains(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    created_by  VARCHAR(64),
    updated_by  VARCHAR(64)
);

CREATE TABLE risk_records (
    id                         BIGSERIAL    PRIMARY KEY,
    risk_number                VARCHAR(20)  NOT NULL UNIQUE,
    title                      VARCHAR(150) NOT NULL,
    description                TEXT,
    domain_id                  BIGINT       REFERENCES risk_domains(id) ON DELETE SET NULL,
    category_id                BIGINT       REFERENCES risk_categories(id) ON DELETE SET NULL,
    risk_owner_username        VARCHAR(64),
    status                     VARCHAR(30)  NOT NULL DEFAULT 'OPEN',
    -- Inherent scoring (1-5 each)
    inherent_likelihood        SMALLINT     NOT NULL DEFAULT 3,
    inherent_impact_financial  SMALLINT     NOT NULL DEFAULT 3,
    inherent_impact_operational SMALLINT    NOT NULL DEFAULT 3,
    inherent_impact_regulatory SMALLINT     NOT NULL DEFAULT 3,
    inherent_impact_reputational SMALLINT   NOT NULL DEFAULT 3,
    -- Residual scoring (1-5 each)
    residual_likelihood        SMALLINT     NOT NULL DEFAULT 1,
    residual_impact_financial  SMALLINT     NOT NULL DEFAULT 1,
    residual_impact_operational SMALLINT    NOT NULL DEFAULT 1,
    residual_impact_regulatory SMALLINT     NOT NULL DEFAULT 1,
    residual_impact_reputational SMALLINT   NOT NULL DEFAULT 1,
    -- Target
    target_risk_score          SMALLINT,
    -- Treatment
    treatment_option           VARCHAR(20),
    treatment_plan             TEXT,
    -- Velocity & review
    risk_velocity              VARCHAR(20),
    related_regulations        TEXT,
    review_frequency           VARCHAR(20)  NOT NULL DEFAULT 'QUARTERLY',
    next_review_date           DATE,
    last_review_date           DATE,
    -- Audit
    created_at                 TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMP    NOT NULL DEFAULT now(),
    created_by                 VARCHAR(64),
    updated_by                 VARCHAR(64)
);

CREATE INDEX idx_risk_records_status   ON risk_records(status);
CREATE INDEX idx_risk_records_domain   ON risk_records(domain_id);
CREATE INDEX idx_risk_records_owner    ON risk_records(risk_owner_username);

-- SAMA-mandated risk domains
INSERT INTO risk_domains (name, description, sort_order) VALUES
    ('Operational',      'Risks from people, processes, systems, and external events', 1),
    ('Compliance',       'Regulatory and legal compliance risks',                      2),
    ('Financial Crime',  'Fraud, AML, and financial crime risks',                     3),
    ('Cyber',            'Cyber security and information security risks',              4),
    ('Credit',           'Credit and counterparty default risks',                     5),
    ('Market',           'Market pricing risks including FX and interest rate',       6),
    ('Liquidity',        'Liquidity and funding risks',                               7),
    ('Reputational',     'Brand, media, and reputational risks',                     8),
    ('Strategic',        'Business model, strategic, and competitive risks',          9);

INSERT INTO risk_categories (domain_id, name, sort_order)
SELECT id, 'IT & Cybersecurity',      1 FROM risk_domains WHERE name = 'Operational'
UNION ALL SELECT id, 'Process Failure',         2 FROM risk_domains WHERE name = 'Operational'
UNION ALL SELECT id, 'People Risk',             3 FROM risk_domains WHERE name = 'Operational'
UNION ALL SELECT id, 'Third-Party & Vendor',    4 FROM risk_domains WHERE name = 'Operational'
UNION ALL SELECT id, 'Business Continuity',     5 FROM risk_domains WHERE name = 'Operational'
UNION ALL SELECT id, 'Regulatory',              1 FROM risk_domains WHERE name = 'Compliance'
UNION ALL SELECT id, 'Legal',                   2 FROM risk_domains WHERE name = 'Compliance'
UNION ALL SELECT id, 'Policy Violation',        3 FROM risk_domains WHERE name = 'Compliance'
UNION ALL SELECT id, 'Fraud',                   1 FROM risk_domains WHERE name = 'Financial Crime'
UNION ALL SELECT id, 'Anti-Money Laundering',   2 FROM risk_domains WHERE name = 'Financial Crime'
UNION ALL SELECT id, 'Bribery & Corruption',    3 FROM risk_domains WHERE name = 'Financial Crime'
UNION ALL SELECT id, 'Data Breach',             1 FROM risk_domains WHERE name = 'Cyber'
UNION ALL SELECT id, 'System Compromise',       2 FROM risk_domains WHERE name = 'Cyber'
UNION ALL SELECT id, 'Insider Threat',          3 FROM risk_domains WHERE name = 'Cyber'
UNION ALL SELECT id, 'Phishing & Social Eng.',  4 FROM risk_domains WHERE name = 'Cyber'
UNION ALL SELECT id, 'Corporate Credit',        1 FROM risk_domains WHERE name = 'Credit'
UNION ALL SELECT id, 'Counterparty',            2 FROM risk_domains WHERE name = 'Credit'
UNION ALL SELECT id, 'FX Risk',                 1 FROM risk_domains WHERE name = 'Market'
UNION ALL SELECT id, 'Interest Rate',           2 FROM risk_domains WHERE name = 'Market'
UNION ALL SELECT id, 'Cash Flow',               1 FROM risk_domains WHERE name = 'Liquidity'
UNION ALL SELECT id, 'Funding',                 2 FROM risk_domains WHERE name = 'Liquidity'
UNION ALL SELECT id, 'Media & Public Relations',1 FROM risk_domains WHERE name = 'Reputational'
UNION ALL SELECT id, 'Customer Relations',      2 FROM risk_domains WHERE name = 'Reputational'
UNION ALL SELECT id, 'Business Model',          1 FROM risk_domains WHERE name = 'Strategic'
UNION ALL SELECT id, 'Competition',             2 FROM risk_domains WHERE name = 'Strategic'
UNION ALL SELECT id, 'Regulatory Change',       3 FROM risk_domains WHERE name = 'Strategic';
