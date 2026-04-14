import * as angular from 'angular';
import { Task, DashboardStats } from '../models/task.model';
import { TaskService } from '../services/task.service';

export class DashboardController {
    static $inject = ['TaskService'];

    stats: DashboardStats = { total: 0, todo: 0, inProgress: 0, done: 0 };
    recentTasks: Task[] = [];

    constructor(private taskService: TaskService) {
        this.loadDashboard();
    }

    getInitials(name: string | null): string {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    private loadDashboard(): void {
        this.taskService.getAll().then((tasks: Task[]) => {
            this.stats = {
                total: tasks.length,
                todo: tasks.filter((t) => t.status === 'TODO').length,
                inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
                done: tasks.filter((t) => t.status === 'DONE').length
            };
            this.recentTasks = tasks.slice(-5).reverse();
        });
    }
}
