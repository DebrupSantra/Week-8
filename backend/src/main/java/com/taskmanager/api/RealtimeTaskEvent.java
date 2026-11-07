package com.taskmanager.api;

import java.time.Instant;
import java.util.UUID;

public record RealtimeTaskEvent(
        TaskEventType type,
        UUID taskId,
        TaskResponse task,
        CommentResponse comment,
        String changedBy,
        Instant occurredAt
) {
}
