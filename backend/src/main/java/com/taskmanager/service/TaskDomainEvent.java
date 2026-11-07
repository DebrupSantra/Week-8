package com.taskmanager.service;

import com.taskmanager.api.RealtimeTaskEvent;

public record TaskDomainEvent(String ownerEmail, RealtimeTaskEvent payload) {
}
