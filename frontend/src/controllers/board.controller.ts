import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';

export class BoardController {
    static $inject = ['$location', 'TaskService'];

    todoTasks: Task[] = [];
    inProgressTasks: Task[] = [];
    doneTasks: Task[] = [];

    constructor(
        private $location: angular.ILocationService,
        private taskService: TaskService
    ) {
        this.loadBoard();
    }

    private loadBoard(): void {
        this.taskService.getAll().then((tasks: Task[]) => {
            this.todoTasks = tasks.filter((t) => t.status === 'TODO');
            this.inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
            this.doneTasks = tasks.filter((t) => t.status === 'DONE');
        });
    }

    moveTask(taskId: number, newStatus: string): void {
        this.taskService.updateStatus(taskId, newStatus).then(() => this.loadBoard());
    }

    getInitials(name: string | null): string {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    openTask(id: number): void {
        this.$location.path('/tasks/' + id);
    }
}
