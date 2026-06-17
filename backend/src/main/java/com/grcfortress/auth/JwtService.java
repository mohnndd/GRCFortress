package com.grcfortress.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLES = "roles";

    private final SecretKey signingKey;
    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.getSecret()));
    }

    public String generateAccessToken(String username, List<String> roles) {
        return buildToken(username, TokenType.ACCESS, roles,
                jwtProperties.getAccessTokenTtlMinutes(), ChronoUnit.MINUTES);
    }

    public String generateRefreshToken(String username) {
        return buildToken(username, TokenType.REFRESH, List.of(),
                jwtProperties.getRefreshTokenTtlDays(), ChronoUnit.DAYS);
    }

    public String generateMfaPendingToken(String username) {
        return buildToken(username, TokenType.MFA_PENDING, List.of(),
                jwtProperties.getMfaTokenTtlMinutes(), ChronoUnit.MINUTES);
    }

    private String buildToken(String username, TokenType type, List<String> roles, long amount, ChronoUnit unit) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .id(UUID.randomUUID().toString())
                .claim(CLAIM_TYPE, type.name())
                .claim(CLAIM_ROLES, roles)
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plus(amount, unit)))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(Claims claims) {
        return claims.getSubject();
    }

    public String extractTokenId(Claims claims) {
        return claims.getId();
    }

    public Instant extractExpiration(Claims claims) {
        return claims.getExpiration().toInstant();
    }

    public TokenType extractTokenType(Claims claims) {
        return TokenType.valueOf(claims.get(CLAIM_TYPE, String.class));
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(Claims claims) {
        return (List<String>) claims.get(CLAIM_ROLES, List.class);
    }

    public boolean isExpired(Claims claims) {
        return claims.getExpiration().before(new java.util.Date());
    }
}
