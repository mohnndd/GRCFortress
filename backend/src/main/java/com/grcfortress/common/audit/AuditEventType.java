package com.grcfortress.common.audit;

public enum AuditEventType {
    LOGIN_ATTEMPT,
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    MFA_CHALLENGE_ISSUED,
    MFA_VERIFICATION_SUCCESS,
    MFA_VERIFICATION_FAILURE,
    TOKEN_REFRESH,
    LOGOUT
}
