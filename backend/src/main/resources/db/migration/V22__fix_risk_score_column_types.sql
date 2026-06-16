-- Hibernate maps Java int to INTEGER; V16 created these as SMALLINT. Widen them.
ALTER TABLE risk_records
    ALTER COLUMN inherent_likelihood          TYPE INTEGER,
    ALTER COLUMN inherent_impact_financial    TYPE INTEGER,
    ALTER COLUMN inherent_impact_operational  TYPE INTEGER,
    ALTER COLUMN inherent_impact_regulatory   TYPE INTEGER,
    ALTER COLUMN inherent_impact_reputational TYPE INTEGER,
    ALTER COLUMN residual_likelihood          TYPE INTEGER,
    ALTER COLUMN residual_impact_financial    TYPE INTEGER,
    ALTER COLUMN residual_impact_operational  TYPE INTEGER,
    ALTER COLUMN residual_impact_regulatory   TYPE INTEGER,
    ALTER COLUMN residual_impact_reputational TYPE INTEGER,
    ALTER COLUMN target_risk_score            TYPE INTEGER;
