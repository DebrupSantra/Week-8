package com.taskmanager.repository;

import com.taskmanager.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findAllByTask_IdAndTask_AssignedUser_EmailOrderByCreatedAtAsc(
            UUID taskId, String email);
}
