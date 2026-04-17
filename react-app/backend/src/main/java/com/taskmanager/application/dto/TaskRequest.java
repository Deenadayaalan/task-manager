package com.taskmanager.application.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Date;

public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private Date dueDate;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
}
