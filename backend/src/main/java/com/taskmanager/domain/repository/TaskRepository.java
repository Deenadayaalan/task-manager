package com.taskmanager.domain.repository;

import com.taskmanager.domain.model.Task;
import com.taskmanager.domain.model.TaskPriority;
import com.taskmanager.domain.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByPriority(TaskPriority priority);
    List<Task> findByAssignee(String assignee);
}
