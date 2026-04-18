// src/types/task.types.ts
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedBy?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  subtasks?: Task[];
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: Date;
  tags?: string[];
  estimatedHours?: number;
  parentTaskId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: Date;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}