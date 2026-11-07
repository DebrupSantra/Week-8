package com.taskmanager.api;

import com.taskmanager.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(@NotNull TaskStatus status) {
}
