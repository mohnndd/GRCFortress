-- Add UUID v7 column to all entity tables.
-- PostgreSQL 17 has native uuidv7() — existing rows get a v7 UUID, new rows default to uuidv7().

ALTER TABLE departments                  ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE department_stakeholders      ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE integration_settings         ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE observations                 ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE observation_messages         ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE observation_closure_requests ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE policies                     ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE policy_approval_cycles       ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE policy_approval_steps        ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE policy_versions              ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE policy_version_files         ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE policy_step_messages         ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE reported_items               ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE reported_item_messages       ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE roles                        ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE users                        ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
ALTER TABLE audit_log                    ADD COLUMN uuid UUID NOT NULL DEFAULT uuidv7() UNIQUE;
