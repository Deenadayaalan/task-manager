import * as angular from 'angular';
import 'angular-route';
import { TaskService } from './services/task.service';
import { DashboardController } from './controllers/dashboard.controller';
import { TaskListController } from './controllers/task-list.controller';
import { TaskFormController } from './controllers/task-form.controller';
import { TaskDetailController } from './controllers/task-detail.controller';
import { BoardController } from './controllers/board.controller';

const app = angular.module('taskManagerApp', ['ngRoute']);

app.config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    $routeProvider
        .when('/', {
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardController',
            controllerAs: '$ctrl'
        })
        .when('/board', {
            templateUrl: 'views/board.html',
            controller: 'BoardController',
            controllerAs: '$ctrl'
        })
        .when('/tasks', {
            templateUrl: 'views/task-list.html',
            controller: 'TaskListController',
            controllerAs: '$ctrl'
        })
        .when('/tasks/new', {
            templateUrl: 'views/task-form.html',
            controller: 'TaskFormController',
            controllerAs: '$ctrl'
        })
        .when('/tasks/:id', {
            templateUrl: 'views/task-detail.html',
            controller: 'TaskDetailController',
            controllerAs: '$ctrl'
        })
        .when('/tasks/:id/edit', {
            templateUrl: 'views/task-form.html',
            controller: 'TaskFormController',
            controllerAs: '$ctrl'
        })
        .otherwise({ redirectTo: '/' });
}]);

// Status label filter
app.filter('taskStatusLabel', () => {
    const labels: Record<string, string> = {
        'TODO': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'DONE': 'Done'
    };
    return (input: string): string => labels[input] || input;
});

app.service('TaskService', TaskService);
app.controller('DashboardController', DashboardController);
app.controller('BoardController', BoardController);
app.controller('TaskListController', TaskListController);
app.controller('TaskFormController', TaskFormController);
app.controller('TaskDetailController', TaskDetailController);
