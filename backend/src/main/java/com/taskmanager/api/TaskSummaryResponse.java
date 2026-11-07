package com.taskmanager.api;

import java.util.List;

public record TaskSummaryResponse(
        long total,
        long completed,
        long pending,
        long overdue,
        double completionRate,
        List<TaskResponse> recentTasks
) {
}
