ALTER TABLE policies
    ADD COLUMN department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    ADD COLUMN product VARCHAR(300);
