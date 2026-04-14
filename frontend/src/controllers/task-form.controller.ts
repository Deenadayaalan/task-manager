import * as angular from 'angular';
import { TaskRequest } from '../models/task.model';
import { TaskService } from '../services/task.service';

export class TaskFormController {
    static $inject = ['$routeParams', '$location', 'TaskService'];

    isEdit: boolean;
    task: TaskRequest = { title: '', status: 'TODO', priority: 'MEDIUM' };
    success: string = '';
    error: string = '';

    constructor(
        private $routeParams: angular.route.IRouteParamsService,
        private $location: angular.ILocationService,
        private taskService: TaskService
    ) {
        this.isEdit = !!$routeParams['id'];
        if (this.isEdit) {
            this.loadTask(parseInt($routeParams['id'], 10));
        }
    }

    private loadTask(id: number): void {
        this.taskService.getById(id).then((task) => {
            this.task = {
                title: task.title,
                description: task.description || undefined,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee || undefined,
                dueDate: task.dueDate || undefined
            };
        });
    }

    saveTask(): void {
        if (!this.task.title) {
            this.error = 'Title is required';
            return;
        }
        this.error = '';
        const payload: TaskRequest = { ...this.task };

        const promise = this.isEdit
            ? this.taskService.update(parseInt(this.$routeParams['id'], 10), payload)
            : this.taskService.create(payload);

        promise.then(
            () => this.$location.path('/tasks'),
            (err: any) => {
                this.error = err.data && err.data.error ? err.data.error : 'Failed to save task';
            }
        );
    }
}
