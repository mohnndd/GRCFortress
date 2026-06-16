package com.grcfortress.auth;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {
    boolean existsByJti(String jti);

    long deleteByExpiresAtBefore(Instant cutoff);
}
