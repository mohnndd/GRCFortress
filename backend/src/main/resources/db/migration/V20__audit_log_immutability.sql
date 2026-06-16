-- Tamper-evidence for the audit trail (SAMA / ISO 27001 expect audit logs to
-- be demonstrably immutable, not just "the UI has no delete button").
--
-- 1. Hash chaining: every new row stores a SHA-256 hash of its own content
--    plus the previous row's hash. Altering or deleting a past row breaks
--    the chain for every row written after it, which AuditService.verifyChain()
--    can detect. Rows written before this migration have no hash - the
--    chain can only attest to entries from this point forward, which is
--    inherent to retrofitting a hash chain onto existing data.
-- 2. Append-only enforcement: a trigger rejects UPDATE and DELETE on
--    audit_log outright, for any role, including the application's own DB
--    user. This makes immutability a database-level guarantee rather than
--    something that depends on the application never having a bug or a
--    direct DB session never running a manual UPDATE/DELETE.

ALTER TABLE audit_log ADD COLUMN prev_hash  VARCHAR(64);
ALTER TABLE audit_log ADD COLUMN entry_hash VARCHAR(64);

CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS TRIGGER AS $audit_guard$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP;
END;
$audit_guard$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

CREATE TRIGGER audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
