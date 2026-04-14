package com.taskmanager.infrastructure.config;

import com.taskmanager.domain.model.Task;
import com.taskmanager.domain.model.TaskPriority;
import com.taskmanager.domain.model.TaskStatus;
import com.taskmanager.domain.repository.TaskRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;

@Component
public class DataSeeder implements CommandLineRunner {

    private final TaskRepository taskRepository;

    public DataSeeder(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public void run(String... args) {
        if (taskRepository.count() > 0) return;

        taskRepository.saveAll(Arrays.asList(
            task("Set up project repository", "Initialize Git repo, configure branch protection rules, and set up CI/CD pipeline", TaskStatus.DONE, TaskPriority.HIGH, "Alice", -10),
            task("Design database schema", "Create ERD diagram and define table relationships for the task management system", TaskStatus.DONE, TaskPriority.HIGH, "Bob", -8),
            task("Implement user authentication", "Set up JWT-based auth with login, registration, and password reset flows", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, "Alice", 3),
            task("Build REST API endpoints", "Create CRUD endpoints for tasks, projects, and user management", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, "Charlie", 5),
            task("Create task board UI", "Build a Kanban-style drag and drop board with columns for each status", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, "Diana", 7),
            task("Add search and filtering", "Implement full-text search and advanced filtering by status, priority, assignee, and date range", TaskStatus.TODO, TaskPriority.MEDIUM, "Bob", 10),
            task("Write unit tests", "Achieve 80% code coverage for service layer and controllers", TaskStatus.TODO, TaskPriority.MEDIUM, "Charlie", 12),
            task("Set up monitoring and logging", "Configure application logging, health checks, and performance monitoring dashboards", TaskStatus.TODO, TaskPriority.LOW, "Alice", 14),
            task("Performance optimization", "Profile and optimize database queries, add caching layer, and lazy loading", TaskStatus.TODO, TaskPriority.LOW, "Diana", 18),
            task("Write API documentation", "Create OpenAPI/Swagger docs for all REST endpoints with examples", TaskStatus.TODO, TaskPriority.LOW, "Bob", 20)
        ));
    }

    private Task task(String title, String desc, TaskStatus status, TaskPriority priority, String assignee, int dueDaysFromNow) {
        Task t = new Task();
        t.setTitle(title);
        t.setDescription(desc);
        t.setStatus(status);
        t.setPriority(priority);
        t.setAssignee(assignee);
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, dueDaysFromNow);
        t.setDueDate(cal.getTime());
        return t;
    }
}
