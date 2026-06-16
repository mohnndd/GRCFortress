ALTER TABLE departments ADD COLUMN sort_order INT NOT NULL DEFAULT 0;

-- Assign initial sequential order based on insertion order
UPDATE departments d
SET sort_order = sub.rn * 10
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM departments
) sub
WHERE d.id = sub.id;
