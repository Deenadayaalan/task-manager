export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignee: string | null;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TaskRequest {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee?: string;
    dueDate?: string;
}

export interface DashboardStats {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskFilter {
    status: string;
    priority: string;
}
