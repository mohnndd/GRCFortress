-- Add designated-head flag to department stakeholders.
-- Application enforces: at most one is_head=true per department at a time.

ALTER TABLE department_stakeholders
    ADD COLUMN is_head BOOLEAN NOT NULL DEFAULT FALSE;
