-- Department configuration: organizational departments and their
-- stakeholder positions (e.g. Technology / CTO).

CREATE TABLE departments (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(1000),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),
    created_by  VARCHAR(64),
    updated_by  VARCHAR(64)
);

CREATE TABLE department_stakeholders (
    id              BIGSERIAL PRIMARY KEY,
    department_id   BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    position_title  VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    employee_number VARCHAR(50)  NOT NULL UNIQUE,
    phone_number    VARCHAR(20)  NOT NULL,
    email_username  VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      VARCHAR(64),
    updated_by      VARCHAR(64)
);

CREATE INDEX idx_dept_stakeholders_department_id ON department_stakeholders(department_id);
