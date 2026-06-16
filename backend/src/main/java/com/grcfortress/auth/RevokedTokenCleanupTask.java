package com.grcfortress.auth;

import java.time.Instant;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Prunes denylist entries once their token would have expired anyway, so
 * revoked_token doesn't grow without bound.
 */
@Component
public class RevokedTokenCleanupTask {

    private final RevokedTokenRepository revokedTokenRepository;

    public RevokedTokenCleanupTask(RevokedTokenRepository revokedTokenRepository) {
        this.revokedTokenRepository = revokedTokenRepository;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpiredEntries() {
        revokedTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }
}
