package com.taskmanager.service;

import com.taskmanager.api.CommentRequest;
import com.taskmanager.api.CommentResponse;
import com.taskmanager.api.PageResponse;
import com.taskmanager.api.RealtimeTaskEvent;
import com.taskmanager.api.TaskRequest;
import com.taskmanager.api.TaskResponse;
import com.taskmanager.api.TaskSummaryResponse;
import com.taskmanager.api.TaskEventType;
import com.taskmanager.domain.Comment;
import com.taskmanager.domain.Task;
import com.taskmanager.domain.TaskPriority;
import com.taskmanager.domain.TaskStatus;
import com.taskmanager.repository.CommentRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.time.LocalDate;

@Service
@Transactional
public class TaskService {

    private static final int MAX_PAGE_SIZE = 100;

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository,
                       CommentRepository commentRepository, ApplicationEventPublisher eventPublisher) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> list(String email, int page, int size, TaskStatus status,
                                           TaskPriority priority, String search, String sortBy,
                                           Sort.Direction direction) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Page must be non-negative and size must be 1-100.");
        }
        String property = switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "createdat" -> "createdAt";
            case "updatedat" -> "updatedAt";
            case "duedate" -> "dueDate";
            case "title" -> "title";
            default -> throw new IllegalArgumentException(
                    "sortBy must be one of createdAt, updatedAt, dueDate, or title.");
        };
        Page<TaskResponse> result = taskRepository.findAll(
                TaskSpecifications.forSearch(email, status, priority, search),
                PageRequest.of(page, size, Sort.by(direction, property))
        ).map(TaskResponse::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public TaskSummaryResponse summary(String email) {
        long total = taskRepository.countByAssignedUser_Email(email);
        long completed = taskRepository.countByAssignedUser_EmailAndStatus(email, TaskStatus.DONE);
        long pending = taskRepository.countByAssignedUser_EmailAndStatus(email, TaskStatus.TODO)
                + taskRepository.countByAssignedUser_EmailAndStatus(email, TaskStatus.IN_PROGRESS);
        long overdue = taskRepository.countByAssignedUser_EmailAndDueDateBeforeAndStatusNot(
                email, LocalDate.now(), TaskStatus.DONE);
        List<TaskResponse> recentTasks = taskRepository.findAllByAssignedUser_Email(email,
                        PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "updatedAt")))
                .map(TaskResponse::from)
                .getContent();
        double completionRate = total == 0 ? 0 : (completed * 100.0) / total;
        return new TaskSummaryResponse(total, completed, pending, overdue, completionRate,
                recentTasks);
    }

    @Transactional(readOnly = true)
    public TaskResponse get(String email, UUID id) {
        return TaskResponse.from(findOwnedTask(email, id));
    }

    public TaskResponse create(String email, TaskRequest request) {
        var owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user was not found."));
        Task task = new Task(request.title().trim(), request.description(), request.status(),
                request.priority(), request.dueDate(), owner);
        TaskResponse response = TaskResponse.from(taskRepository.save(task));
        publish(owner.getEmail(), TaskEventType.TASK_CREATED, task.getId(), response, null);
        return response;
    }

    public TaskResponse update(String email, UUID id, TaskRequest request) {
        Task task = findOwnedTask(email, id);
        task.update(request.title().trim(), request.description(), request.status(),
                request.priority(), request.dueDate());
        TaskResponse response = TaskResponse.from(taskRepository.save(task));
        publish(email, TaskEventType.TASK_UPDATED, task.getId(), response, null);
        return response;
    }

    public TaskResponse updateStatus(String email, UUID id, TaskStatus status) {
        Task task = findOwnedTask(email, id);
        task.changeStatus(status);
        TaskResponse response = TaskResponse.from(taskRepository.save(task));
        publish(email, TaskEventType.TASK_STATUS_CHANGED, task.getId(), response, null);
        return response;
    }

    public void delete(String email, UUID id) {
        Task task = findOwnedTask(email, id);
        TaskResponse response = TaskResponse.from(task);
        taskRepository.delete(task);
        publish(email, TaskEventType.TASK_DELETED, task.getId(), response, null);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(String email, UUID taskId) {
        findOwnedTask(email, taskId);
        return commentRepository
                .findAllByTask_IdAndTask_AssignedUser_EmailOrderByCreatedAtAsc(taskId, email)
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    public CommentResponse addComment(String email, UUID taskId, CommentRequest request) {
        Task task = findOwnedTask(email, taskId);
        var author = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user was not found."));
        Comment comment = commentRepository.save(new Comment(request.content().trim(), task, author));
        CommentResponse response = CommentResponse.from(comment);
        publish(email, TaskEventType.COMMENT_ADDED, taskId, null, response);
        return response;
    }

    private Task findOwnedTask(String email, UUID id) {
        return taskRepository.findByIdAndAssignedUser_Email(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Task was not found."));
    }

    private void publish(String ownerEmail, TaskEventType type, UUID taskId,
                         TaskResponse task, CommentResponse comment) {
        eventPublisher.publishEvent(new TaskDomainEvent(ownerEmail, new RealtimeTaskEvent(
                type, taskId, task, comment, ownerEmail, java.time.Instant.now())));
    }
}
