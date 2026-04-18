// src/services/api/taskApi.ts
import { apiClient } from './apiClient';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../../types/task.types';
import { TaskFilters } from '../../hooks/useTaskService';

export interface TaskApiResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

class TaskApiService {
  private baseUrl = '/api/tasks';

  async createTask(task: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<Task>(this.baseUrl, task);
    return response.data;
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<Task>(`${this.baseUrl}/${id}`, updates);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiClient.get<TaskApiResponse>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data.data;
  }

  async bulkUpdateTasks(taskIds: string[], updates: Partial<UpdateTaskRequest>): Promise<Task[]> {
    const response = await apiClient.patch<Task[]>(`${this.baseUrl}/bulk`, {
      taskIds,
      updates,
    });
    return response.data;
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/bulk`, {
      data: { taskIds },
    });
  }

  subscribeToUpdates(callback: (task: Task) => void): () => void {
    // WebSocket implementation for real-time updates
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/tasks`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TASK_UPDATED') {
        callback(data.task);
      }
    };

    return () => {
      ws.close();
    };
  }
}

export const taskApi = new TaskApiService();