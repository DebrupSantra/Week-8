package com.taskmanager.api;

import com.taskmanager.domain.Task;
import com.taskmanager.domain.TaskPriority;
import com.taskmanager.domain.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        Instant createdAt,
        Instant updatedAt,
        UUID assignedUserId
) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getAssignedUser().getId()
        );
    }
}
