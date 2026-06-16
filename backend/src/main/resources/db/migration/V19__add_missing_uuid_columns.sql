-- Add uuid columns to tables created after V12 (uuid_v7 migration) that extend AuditableEntity
-- PostgreSQL 18 supports uuidv7() natively

ALTER TABLE circulars           ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE sla_process_rules   ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE risk_domains        ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE risk_categories     ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE risk_records        ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE authority_delegations ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
