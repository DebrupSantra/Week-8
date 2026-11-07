package com.taskmanager.api;

import com.taskmanager.service.AuthSession;
import com.taskmanager.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";

    private final AuthService authService;
    private final Duration refreshTokenTtl;
    private final boolean secureCookie;
    private final String sameSite;

    public AuthController(
            AuthService authService,
            @Value("${app.security.jwt.refresh-token-ttl}") Duration refreshTokenTtl,
            @Value("${app.security.cookie.secure}") boolean secureCookie,
            @Value("${app.security.cookie.same-site}") String sameSite) {
        this.authService = authService;
        this.refreshTokenTtl = refreshTokenTtl;
        this.secureCookie = secureCookie;
        this.sameSite = sameSite;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        return withRefreshCookie(authService.refresh(refreshToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(Authentication authentication) {
        return new ApiResponse<>(authService.getCurrentUser(authentication.getName()));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> withRefreshCookie(
            AuthSession session, HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE,
                        refreshCookie(session.refreshToken(), refreshTokenTtl).toString())
                .body(new ApiResponse<>(session.response()));
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/api/auth")
                .sameSite(sameSite)
                .maxAge(maxAge)
                .build();
    }
}
