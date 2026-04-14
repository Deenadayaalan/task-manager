package com.taskmanager.application.dto;

import com.taskmanager.domain.model.Task;
import java.util.Date;

public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private Date dueDate;
    private Date createdAt;
    private Date updatedAt;

    public static TaskResponse fromEntity(Task task) {
        TaskResponse dto = new TaskResponse();
        dto.id = task.getId();
        dto.title = task.getTitle();
        dto.description = task.getDescription();
        dto.status = task.getStatus().name();
        dto.priority = task.getPriority().name();
        dto.assignee = task.getAssignee();
        dto.dueDate = task.getDueDate();
        dto.createdAt = task.getCreatedAt();
        dto.updatedAt = task.getUpdatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public String getPriority() { return priority; }
    public String getAssignee() { return assignee; }
    public Date getDueDate() { return dueDate; }
    public Date getCreatedAt() { return createdAt; }
    public Date getUpdatedAt() { return updatedAt; }
}
