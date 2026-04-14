import { Task, TaskFilter } from '../models/task.model';
import { TaskService } from '../services/task.service';

export class TaskListController {
    static $inject = ['TaskService'];

    tasks: Task[] = [];
    filter: TaskFilter = { status: '', priority: '' };

    constructor(private taskService: TaskService) {
        this.applyFilter();
    }

    getInitials(name: string | null): string {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    applyFilter(): void {
        const params: Record<string, string> = {};
        if (this.filter.status) {
            params['status'] = this.filter.status;
        } else if (this.filter.priority) {
            params['priority'] = this.filter.priority;
        }
        this.taskService.getAll(params).then((tasks: Task[]) => {
            this.tasks = tasks;
        });
    }

    deleteTask(id: number): void {
        if (confirm('Delete this task?')) {
            this.taskService.remove(id).then(() => this.applyFilter());
        }
    }
}
