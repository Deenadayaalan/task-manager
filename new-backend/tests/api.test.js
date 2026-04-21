import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, 'test-taskflow.db');

// Set DB_PATH before requiring any app modules
process.env.DB_PATH = TEST_DB_PATH;

// Clean up any leftover test DB
for (const suffix of ['', '-shm', '-wal']) {
  const f = TEST_DB_PATH + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

// Now require the app (which will use the test DB)
const { default: supertest } = await import('supertest');

// Clear cached modules so db.js picks up the new DB_PATH
for (const key of Object.keys(require.cache)) {
  if (
    key.includes('new-backend') &&
    !key.includes('node_modules') &&
    !key.includes('tests')
  ) {
    delete require.cache[key];
  }
}

const app = require('../server');
const request = supertest(app);

/**
 * Validates that a task object has the exact response shape
 * matching the original Java TaskResponse DTO.
 */
function expectTaskShape(task) {
  expect(task).toHaveProperty('id');
  expect(task).toHaveProperty('title');
  expect(task).toHaveProperty('description');
  expect(task).toHaveProperty('status');
  expect(task).toHaveProperty('priority');
  expect(task).toHaveProperty('assignee');
  expect(task).toHaveProperty('dueDate');
  expect(task).toHaveProperty('createdAt');
  expect(task).toHaveProperty('updatedAt');

  // Validate types
  expect(typeof task.id).toBe('number');
  expect(typeof task.title).toBe('string');
  expect(['string', 'object'].includes(typeof task.description)).toBe(true); // string or null
  expect(['TODO', 'IN_PROGRESS', 'DONE']).toContain(task.status);
  expect(['LOW', 'MEDIUM', 'HIGH']).toContain(task.priority);
  expect(typeof task.createdAt).toBe('string');
  expect(typeof task.updatedAt).toBe('string');
}

afterAll(() => {
  // Clean up test database files
  for (const suffix of ['', '-shm', '-wal']) {
    const f = TEST_DB_PATH + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

// ─── 12.1 API Endpoint Integration Tests ────────────────────────────────────

describe('12.1 — API Endpoint Integration Tests', () => {
  // 1. GET /api/tasks — returns 200 with array of tasks, each with all 9 fields
  it('GET /api/tasks returns 200 with array of task objects with all 9 fields', async () => {
    const res = await request.get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const task of res.body) {
      expectTaskShape(task);
    }
  });

  // 2. GET /api/tasks?status=TODO — returns only TODO tasks
  it('GET /api/tasks?status=TODO returns only tasks with status TODO', async () => {
    const res = await request.get('/api/tasks').query({ status: 'TODO' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const task of res.body) {
      expect(task.status).toBe('TODO');
      expectTaskShape(task);
    }
  });

  // 3. GET /api/tasks?priority=HIGH — returns only HIGH priority tasks
  it('GET /api/tasks?priority=HIGH returns only tasks with priority HIGH', async () => {
    const res = await request.get('/api/tasks').query({ priority: 'HIGH' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const task of res.body) {
      expect(task.priority).toBe('HIGH');
      expectTaskShape(task);
    }
  });

  // 4. GET /api/tasks?assignee=Alice — returns only Alice's tasks
  it('GET /api/tasks?assignee=Alice returns only tasks assigned to Alice', async () => {
    const res = await request.get('/api/tasks').query({ assignee: 'Alice' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const task of res.body) {
      expect(task.assignee).toBe('Alice');
      expectTaskShape(task);
    }
  });

  // 5. GET /api/tasks/:id — returns 200 with single task with all 9 fields
  it('GET /api/tasks/:id returns 200 with a single task object with all 9 fields', async () => {
    const res = await request.get('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expectTaskShape(res.body);
    expect(res.body.id).toBe(1);
  });

  // 6. GET /api/tasks/999 — returns 404
  it('GET /api/tasks/999 returns 404 with correct error message', async () => {
    const res = await request.get('/api/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Task not found with id: 999' });
  });

  // 7. POST /api/tasks — creates a task, returns 201 with all 9 fields
  it('POST /api/tasks creates a task and returns 201 with all 9 fields', async () => {
    const newTask = {
      title: 'Integration test task',
      description: 'Created during integration testing',
      priority: 'HIGH',
      assignee: 'TestUser',
    };

    const res = await request.post('/api/tasks').send(newTask);
    expect(res.status).toBe(201);
    expectTaskShape(res.body);
    expect(res.body.title).toBe('Integration test task');
    expect(res.body.description).toBe('Created during integration testing');
    expect(res.body.status).toBe('TODO'); // default
    expect(res.body.priority).toBe('HIGH');
    expect(res.body.assignee).toBe('TestUser');
    expect(res.body.id).toBeGreaterThan(0);
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
  });

  // 8. POST /api/tasks without title — returns 400
  it('POST /api/tasks without title returns 400', async () => {
    const res = await request.post('/api/tasks').send({ description: 'No title' });
    expect(res.status).toBe(400);
  });

  // 9. PUT /api/tasks/:id — updates a task, returns 200 with updated task
  it('PUT /api/tasks/:id updates a task and returns 200 with updated task', async () => {
    const res = await request.put('/api/tasks/1').send({
      title: 'Updated project repository',
      priority: 'LOW',
    });
    expect(res.status).toBe(200);
    expectTaskShape(res.body);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe('Updated project repository');
    expect(res.body.priority).toBe('LOW');
  });

  // 10. PATCH /api/tasks/:id/status — updates status only, returns 200
  it('PATCH /api/tasks/:id/status updates status and returns 200 with updated task', async () => {
    const res = await request.patch('/api/tasks/1/status').send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expectTaskShape(res.body);
    expect(res.body.id).toBe(1);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  // 11. DELETE /api/tasks/:id — returns 204 No Content
  it('DELETE /api/tasks/:id returns 204 No Content', async () => {
    // Create a task to delete so we don't affect seed data
    const createRes = await request.post('/api/tasks').send({ title: 'To be deleted' });
    const taskId = createRes.body.id;

    const res = await request.delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  // 12. DELETE /api/tasks/999 — returns 404
  it('DELETE /api/tasks/999 returns 404', async () => {
    const res = await request.delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });
});
