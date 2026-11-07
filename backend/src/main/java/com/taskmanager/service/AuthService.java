package com.taskmanager.service;

import com.taskmanager.api.AuthResponse;
import com.taskmanager.api.LoginRequest;
import com.taskmanager.api.RegisterRequest;
import com.taskmanager.api.UserResponse;
import com.taskmanager.domain.User;
import com.taskmanager.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthSession register(RegisterRequest request) {
        validatePasswordLength(request.password());
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }
        User user = userRepository.save(new User(request.fullName().trim(), email,
                passwordEncoder.encode(request.password())));
        return createSession(user);
    }

    public AuthSession login(LoginRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new InvalidCredentialsException();
        }
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .filter(candidate -> passwordEncoder.matches(request.password(),
                        candidate.getPasswordHash()))
                .orElseThrow(InvalidCredentialsException::new);
        return createSession(user);
    }

    public AuthSession refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        User user = refreshTokenService.consume(rawRefreshToken);
        return createSession(user);
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user was not found."));
    }

    private AuthSession createSession(User user) {
        String accessToken = jwtService.createAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.issue(user);
        AuthResponse response = new AuthResponse(accessToken, "Bearer",
                jwtService.getAccessTokenTtlSeconds(), UserResponse.from(user));
        return new AuthSession(response, refreshToken);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePasswordLength(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must not exceed 72 UTF-8 bytes.");
        }
    }
}
