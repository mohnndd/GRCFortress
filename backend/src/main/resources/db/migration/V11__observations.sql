CREATE TABLE observations (
    id BIGSERIAL PRIMARY KEY,
    observation_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    control_violation TEXT,
    is_regulation_related BOOLEAN NOT NULL DEFAULT FALSE,
    regulation_file_name VARCHAR(500),
    regulation_file_path VARCHAR(1000),
    proposed_target_date DATE,
    confirmed_target_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    creator_department_id BIGINT NOT NULL REFERENCES departments(id),
    receiving_department_id BIGINT NOT NULL REFERENCES departments(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64)
);

CREATE TABLE observation_messages (
    id BIGSERIAL PRIMARY KEY,
    observation_id BIGINT NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    author_username VARCHAR(64) NOT NULL,
    author_name VARCHAR(200),
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE observation_closure_requests (
    id BIGSERIAL PRIMARY KEY,
    observation_id BIGINT NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    evidence_file_name VARCHAR(500),
    evidence_file_path VARCHAR(1000),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    submitted_by VARCHAR(64),
    submitted_at TIMESTAMP NOT NULL DEFAULT now(),
    decided_by VARCHAR(64),
    decided_at TIMESTAMP
);

CREATE INDEX idx_obs_creator_dept ON observations(creator_department_id);
CREATE INDEX idx_obs_receiving_dept ON observations(receiving_department_id);
CREATE INDEX idx_obs_messages ON observation_messages(observation_id);
CREATE INDEX idx_obs_closure ON observation_closure_requests(observation_id);
