const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

// GET /api/tasks — list all, with optional filters: ?status, ?priority, ?assignee, ?search
router.get('/', (req, res) => {
  try {
    const { status, priority, assignee, search } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignee) filters.assignee = assignee;
    if (search) filters.search = search;

    const tasks = taskService.getAllTasks(filters);
    res.json(tasks);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// POST /api/tasks/bulk-status — update status for multiple tasks
router.post('/bulk-status', (req, res) => {
  try {
    const { taskIds, status } = req.body;
    const result = taskService.bulkUpdateStatus(taskIds, status);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// POST /api/tasks/bulk-delete — delete multiple tasks
router.post('/bulk-delete', (req, res) => {
  try {
    const { taskIds } = req.body;
    const result = taskService.bulkDeleteTasks(taskIds);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// GET /api/tasks/:id — get single task
router.get('/:id', (req, res) => {
  try {
    const task = taskService.getTaskById(Number(req.params.id));
    res.json(task);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// POST /api/tasks — create task
router.post('/', (req, res) => {
  try {
    const task = taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', (req, res) => {
  try {
    const task = taskService.updateTask(Number(req.params.id), req.body);
    res.json(task);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/status — update status only
router.patch('/:id/status', (req, res) => {
  try {
    const task = taskService.updateTaskStatus(Number(req.params.id), req.body.status);
    res.json(task);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', (req, res) => {
  try {
    taskService.deleteTask(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;
