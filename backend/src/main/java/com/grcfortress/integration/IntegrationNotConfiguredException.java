package com.grcfortress.integration;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Thrown when a notification is requested but the relevant integration is not configured or disabled. */
@ResponseStatus(HttpStatus.CONFLICT)
public class IntegrationNotConfiguredException extends RuntimeException {

    public IntegrationNotConfiguredException(String message) {
        super(message);
    }
}
