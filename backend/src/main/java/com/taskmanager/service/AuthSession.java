package com.taskmanager.service;

import com.taskmanager.api.AuthResponse;

public record AuthSession(AuthResponse response, String refreshToken) {
}
