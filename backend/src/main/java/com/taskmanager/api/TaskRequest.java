package com.taskmanager.api;

import com.taskmanager.domain.TaskPriority;
import com.taskmanager.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 5000) String description,
        @NotNull TaskStatus status,
        @NotNull TaskPriority priority,
        LocalDate dueDate
) {
}
