import axios from 'axios';
import type { Task, TaskRequest } from '../models/task.model';

const API_BASE = '/api/tasks';

const taskService = {
  getAll(params?: Record<string, string>): Promise<Task[]> {
    return axios.get<Task[]>(API_BASE, { params })
      .then((res) => res.data);
  },

  getById(id: number): Promise<Task> {
    return axios.get<Task>(`${API_BASE}/${id}`)
      .then((res) => res.data);
  },

  create(task: TaskRequest): Promise<Task> {
    return axios.post<Task>(API_BASE, task)
      .then((res) => res.data);
  },

  update(id: number, task: TaskRequest): Promise<Task> {
    return axios.put<Task>(`${API_BASE}/${id}`, task)
      .then((res) => res.data);
  },

  updateStatus(id: number, status: string): Promise<Task> {
    return axios.patch<Task>(`${API_BASE}/${id}/status`, { status })
      .then((res) => res.data);
  },

  remove(id: number): Promise<void> {
    return axios.delete(`${API_BASE}/${id}`)
      .then(() => undefined);
  },
};

export default taskService;
