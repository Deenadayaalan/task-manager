import * as angular from 'angular';
import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';

export class TaskDetailController {
    static $inject = ['$routeParams', '$location', 'TaskService'];

    task: Task | null = null;
    error: string = '';

    private taskId: number;

    constructor(
        private $routeParams: angular.route.IRouteParamsService,
        private $location: angular.ILocationService,
        private taskService: TaskService
    ) {
        this.taskId = parseInt($routeParams['id'], 10);
        this.loadTask();
    }

    private loadTask(): void {
        this.taskService.getById(this.taskId).then(
            (task: Task) => { this.task = task; },
            () => { this.error = 'Task not found'; }
        );
    }

    getInitials(name: string | null): string {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    setStatus(status: string): void {
        this.taskService.updateStatus(this.taskId, status).then((task: Task) => {
            this.task = task;
        });
    }

    deleteTask(): void {
        if (confirm('Delete this task?')) {
            this.taskService.remove(this.taskId).then(() => {
                this.$location.path('/tasks');
            });
        }
    }
}
