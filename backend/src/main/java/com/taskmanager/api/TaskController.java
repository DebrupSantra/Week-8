package com.taskmanager.api;

import com.taskmanager.domain.TaskPriority;
import com.taskmanager.domain.TaskStatus;
import com.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/summary")
    public ApiResponse<TaskSummaryResponse> summary(Authentication authentication) {
        return new ApiResponse<>(taskService.summary(authentication.getName()));
    }

    @GetMapping
    public ApiResponse<PageResponse<TaskResponse>> list(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        return new ApiResponse<>(taskService.list(authentication.getName(), page, size,
                status, priority, search, sortBy, direction));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> get(Authentication authentication, @PathVariable UUID id) {
        return new ApiResponse<>(taskService.get(authentication.getName(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> create(Authentication authentication,
                                            @Valid @RequestBody TaskRequest request) {
        return new ApiResponse<>(taskService.create(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> update(Authentication authentication, @PathVariable UUID id,
                                            @Valid @RequestBody TaskRequest request) {
        return new ApiResponse<>(taskService.update(authentication.getName(), id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<TaskResponse> updateStatus(Authentication authentication,
                                                  @PathVariable UUID id,
                                                  @Valid @RequestBody StatusUpdateRequest request) {
        return new ApiResponse<>(taskService.updateStatus(authentication.getName(), id,
                request.status()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        taskService.delete(authentication.getName(), id);
    }

    @GetMapping("/{id}/comments")
    public ApiResponse<java.util.List<CommentResponse>> comments(Authentication authentication,
                                                                 @PathVariable UUID id) {
        return new ApiResponse<>(taskService.listComments(authentication.getName(), id));
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CommentResponse> addComment(Authentication authentication,
                                                   @PathVariable UUID id,
                                                   @Valid @RequestBody CommentRequest request) {
        return new ApiResponse<>(taskService.addComment(authentication.getName(), id, request));
    }
}
