package com.taskmanager.application.service;

import com.taskmanager.application.dto.TaskRequest;
import com.taskmanager.application.dto.TaskResponse;
import com.taskmanager.domain.exception.TaskNotFoundException;
import com.taskmanager.domain.model.Task;
import com.taskmanager.domain.model.TaskPriority;
import com.taskmanager.domain.model.TaskStatus;
import com.taskmanager.domain.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        return TaskResponse.fromEntity(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByStatus(String status) {
        return taskRepository.findByStatus(TaskStatus.valueOf(status)).stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByPriority(String priority) {
        return taskRepository.findByPriority(TaskPriority.valueOf(priority)).stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByAssignee(String assignee) {
        return taskRepository.findByAssignee(assignee).stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TaskResponse createTask(TaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setAssignee(request.getAssignee());
        task.setDueDate(request.getDueDate());
        task.setStatus(request.getStatus() != null ? TaskStatus.valueOf(request.getStatus()) : TaskStatus.TODO);
        task.setPriority(request.getPriority() != null ? TaskPriority.valueOf(request.getPriority()) : TaskPriority.MEDIUM);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(TaskStatus.valueOf(request.getStatus()));
        if (request.getPriority() != null) task.setPriority(TaskPriority.valueOf(request.getPriority()));
        if (request.getAssignee() != null) task.setAssignee(request.getAssignee());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    public TaskResponse updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        task.setStatus(TaskStatus.valueOf(status));
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        taskRepository.delete(task);
    }
}
