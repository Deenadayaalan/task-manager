import * as angular from 'angular';
import { Task, TaskRequest } from '../models/task.model';

const API_BASE = '/api/tasks';

export class TaskService {
    static $inject = ['$http'];

    constructor(private $http: angular.IHttpService) {}

    getAll(params?: Record<string, string>): angular.IPromise<Task[]> {
        return this.$http.get<Task[]>(API_BASE, { params })
            .then((res) => res.data);
    }

    getById(id: number): angular.IPromise<Task> {
        return this.$http.get<Task>(`${API_BASE}/${id}`)
            .then((res) => res.data);
    }

    create(task: TaskRequest): angular.IPromise<Task> {
        return this.$http.post<Task>(API_BASE, task)
            .then((res) => res.data);
    }

    update(id: number, task: TaskRequest): angular.IPromise<Task> {
        return this.$http.put<Task>(`${API_BASE}/${id}`, task)
            .then((res) => res.data);
    }

    updateStatus(id: number, status: string): angular.IPromise<Task> {
        return this.$http.patch<Task>(`${API_BASE}/${id}/status`, { status })
            .then((res) => res.data);
    }

    remove(id: number): angular.IPromise<void> {
        return this.$http.delete<void>(`${API_BASE}/${id}`)
            .then(() => undefined);
    }
}
