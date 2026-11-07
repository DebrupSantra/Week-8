package com.taskmanager.service;

import com.taskmanager.domain.RefreshToken;
import com.taskmanager.domain.User;
import com.taskmanager.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
@Transactional
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final Duration refreshTokenTtl;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.security.jwt.refresh-token-ttl}") Duration refreshTokenTtl) {
        if (refreshTokenTtl.isNegative() || refreshTokenTtl.isZero()) {
            throw new IllegalStateException("JWT refresh-token TTL must be positive.");
        }
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenTtl = refreshTokenTtl;
    }

    public String issue(User user) {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(new RefreshToken(hash(rawToken), user,
                Instant.now().plus(refreshTokenTtl)));
        return rawToken;
    }

    public User consume(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken))
                .filter(candidate -> !candidate.isRevoked())
                .filter(candidate -> candidate.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(InvalidRefreshTokenException::new);
        token.revoke();
        return token.getUser();
    }

    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken))
                .filter(token -> !token.isRevoked())
                .ifPresent(RefreshToken::revoke);
    }

    public Duration getRefreshTokenTtl() {
        return refreshTokenTtl;
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }
}
