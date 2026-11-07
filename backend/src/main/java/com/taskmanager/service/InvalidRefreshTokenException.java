package com.taskmanager.service;

public class InvalidRefreshTokenException extends RuntimeException {

    public InvalidRefreshTokenException() {
        super("The refresh token is invalid or expired.");
    }
}
