package com.grcfortress.user;

/**
 * Well-known baseline RBAC roles, seeded by V1__init_schema.sql.
 */
public final class RoleName {

    public static final String ADMIN = "ADMIN";
    public static final String COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER";
    public static final String AUDITOR = "AUDITOR";
    public static final String REVIEWER = "REVIEWER";
    public static final String EMPLOYEE = "EMPLOYEE";

    private RoleName() {
    }
}
