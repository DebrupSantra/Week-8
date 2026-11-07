package com.taskmanager.service;

import com.taskmanager.domain.Task;
import com.taskmanager.domain.TaskPriority;
import com.taskmanager.domain.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    public static Specification<Task> forSearch(
            String email, TaskStatus status, TaskPriority priority, String search) {
        return (root, query, builder) -> {
            var predicates = builder.conjunction();
            predicates = builder.and(predicates,
                    builder.equal(root.join("assignedUser").get("email"), email));
            if (status != null) {
                predicates = builder.and(predicates,
                        builder.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates = builder.and(predicates,
                        builder.equal(root.get("priority"), priority));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates = builder.and(predicates, builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern)
                ));
            }
            return predicates;
        };
    }
}
