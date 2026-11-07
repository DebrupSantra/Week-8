package com.taskmanager.repository;

import com.taskmanager.domain.Task;
import com.taskmanager.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    Optional<Task> findByIdAndAssignedUser_Email(UUID id, String email);

    long countByAssignedUser_Email(String email);

    long countByAssignedUser_EmailAndStatus(String email, TaskStatus status);

    long countByAssignedUser_EmailAndDueDateBeforeAndStatusNot(
            String email, LocalDate date, TaskStatus excludedStatus);

    Page<Task> findAllByAssignedUser_Email(String email, Pageable pageable);
}
