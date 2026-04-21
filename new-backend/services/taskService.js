const Task = require('../models/task');

class TaskNotFoundError extends Error {
  constructor(id) {
    super(`Task not found with id: ${id}`);
    this.statusCode = 404;
  }
}

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

function getAllTasks(filters = {}) {
  return Task.findAll(filters);
}

function getTaskById(id) {
  const task = Task.findById(id);
  if (!task) {
    throw new TaskNotFoundError(id);
  }
  return task;
}

function getTasksByStatus(status) {
  return Task.findAll({ status });
}

function getTasksByPriority(priority) {
  return Task.findAll({ priority });
}

function getTasksByAssignee(assignee) {
  return Task.findAll({ assignee });
}

function createTask(data) {
  if (!data.title) {
    const err = new Error('Title is required');
    err.statusCode = 400;
    throw err;
  }

  const taskData = {
    title: data.title,
    description: data.description || null,
    status: data.status || 'TODO',
    priority: data.priority || 'MEDIUM',
    assignee: data.assignee || null,
    dueDate: data.dueDate || null,
  };

  return Task.create(taskData);
}

function updateTask(id, data) {
  const task = Task.update(id, data);
  if (!task) {
    throw new TaskNotFoundError(id);
  }
  return task;
}

function updateTaskStatus(id, status) {
  const task = Task.updateStatus(id, status);
  if (!task) {
    throw new TaskNotFoundError(id);
  }
  return task;
}

function deleteTask(id) {
  const deleted = Task.delete(id);
  if (!deleted) {
    throw new TaskNotFoundError(id);
  }
}

function bulkUpdateStatus(taskIds, status) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    const err = new Error('taskIds must be a non-empty array');
    err.statusCode = 400;
    throw err;
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const updated = Task.bulkUpdateStatus(taskIds, status);
  return { updated };
}

function bulkDeleteTasks(taskIds) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    const err = new Error('taskIds must be a non-empty array');
    err.statusCode = 400;
    throw err;
  }
  const deleted = Task.bulkDelete(taskIds);
  return { deleted };
}

module.exports = {
  TaskNotFoundError,
  VALID_STATUSES,
  VALID_PRIORITIES,
  getAllTasks,
  getTaskById,
  getTasksByStatus,
  getTasksByPriority,
  getTasksByAssignee,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  bulkUpdateStatus,
  bulkDeleteTasks,
};
