/**
 * TaskFlow API Contract Tests
 *
 * These tests verify functional parity between the legacy Java/Spring Boot
 * backend and the modernised Node.js/Express backend.
 *
 * Usage:
 *   BASE_URL=http://localhost:8080 npm test   # against Java backend
 *   BASE_URL=http://localhost:3001 npm test   # against Node.js backend
 *
 * Both backends must expose the same REST contract on /api/tasks.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API = `${BASE_URL}/api/tasks`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Thin wrapper around fetch that returns { status, body } */
async function api(method, path, body) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

/** Create a task and return its full response body (including id). */
async function createTask(overrides = {}) {
  const payload = {
    title: 'Contract Test Task',
    description: 'Created by contract tests',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: 'Tester',
    dueDate: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
  const { status, body } = await api('POST', '', payload);
  expect(status).toBe(201);
  return body;
}

/** Delete a task, ignoring 404 (already gone). */
async function deleteTask(id) {
  await api('DELETE', `/${id}`);
}

/* ------------------------------------------------------------------ */
/*  Track tasks created during tests so we can clean up                */
/* ------------------------------------------------------------------ */

const createdIds = [];

afterAll(async () => {
  for (const id of createdIds) {
    await deleteTask(id);
  }
});

/* ================================================================== */
/*  1. HEALTH / CONNECTIVITY                                           */
/* ================================================================== */

describe('Health & connectivity', () => {
  it('GET /api/tasks returns 200 and an array', async () => {
    const { status, body } = await api('GET', '');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

/* ================================================================== */
/*  2. CREATE (POST /api/tasks)                                        */
/* ================================================================== */

describe('Create task', () => {
  it('creates a task and returns 201 with the task body', async () => {
    const task = await createTask({ title: 'Create Test' });
    createdIds.push(task.id);

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Create Test');
    expect(task.status).toBe('TODO');
    expect(task.priority).toBe('MEDIUM');
    expect(task.assignee).toBe('Tester');
  });

  it('returns the correct field shape', async () => {
    const task = await createTask({ title: 'Shape Test' });
    createdIds.push(task.id);

    // Both backends must return these fields
    const requiredFields = [
      'id', 'title', 'description', 'status',
      'priority', 'assignee', 'dueDate',
      'createdAt', 'updatedAt',
    ];
    for (const field of requiredFields) {
      expect(task).toHaveProperty(field);
    }
  });

  it('defaults status to TODO when omitted', async () => {
    const { status, body } = await api('POST', '', {
      title: 'Default Status Test',
      priority: 'LOW',
    });
    expect(status).toBe(201);
    expect(body.status).toBe('TODO');
    createdIds.push(body.id);
  });

  it('defaults priority to MEDIUM when omitted', async () => {
    const { status, body } = await api('POST', '', {
      title: 'Default Priority Test',
    });
    expect(status).toBe(201);
    expect(body.priority).toBe('MEDIUM');
    createdIds.push(body.id);
  });
});

/* ================================================================== */
/*  3. READ (GET /api/tasks/:id)                                       */
/* ================================================================== */

describe('Read task', () => {
  it('retrieves a task by id', async () => {
    const created = await createTask({ title: 'Read Test' });
    createdIds.push(created.id);

    const { status, body } = await api('GET', `/${created.id}`);
    expect(status).toBe(200);
    expect(body.id).toBe(created.id);
    expect(body.title).toBe('Read Test');
  });

  it('returns 404 for a non-existent task', async () => {
    const { status } = await api('GET', '/999999');
    expect(status).toBe(404);
  });
});

/* ================================================================== */
/*  4. UPDATE (PUT /api/tasks/:id)                                     */
/* ================================================================== */

describe('Update task', () => {
  it('updates title and description', async () => {
    const created = await createTask({ title: 'Before Update' });
    createdIds.push(created.id);

    const { status, body } = await api('PUT', `/${created.id}`, {
      title: 'After Update',
      description: 'Updated description',
    });
    expect(status).toBe(200);
    expect(body.title).toBe('After Update');
    expect(body.description).toBe('Updated description');
  });

  it('updates priority', async () => {
    const created = await createTask({ title: 'Priority Update', priority: 'LOW' });
    createdIds.push(created.id);

    const { status, body } = await api('PUT', `/${created.id}`, {
      title: 'Priority Update',
      priority: 'HIGH',
    });
    expect(status).toBe(200);
    expect(body.priority).toBe('HIGH');
  });

  it('returns 404 when updating a non-existent task', async () => {
    const { status } = await api('PUT', '/999999', { title: 'Ghost' });
    expect(status).toBe(404);
  });
});

/* ================================================================== */
/*  5. STATUS TRANSITIONS (PATCH /api/tasks/:id/status)                */
/* ================================================================== */

describe('Status transitions', () => {
  it('transitions TODO → IN_PROGRESS', async () => {
    const created = await createTask({ title: 'Status Test', status: 'TODO' });
    createdIds.push(created.id);

    const { status, body } = await api('PATCH', `/${created.id}/status`, {
      status: 'IN_PROGRESS',
    });
    expect(status).toBe(200);
    expect(body.status).toBe('IN_PROGRESS');
  });

  it('transitions IN_PROGRESS → DONE', async () => {
    const created = await createTask({ title: 'Done Test', status: 'IN_PROGRESS' });
    createdIds.push(created.id);

    const { status, body } = await api('PATCH', `/${created.id}/status`, {
      status: 'DONE',
    });
    expect(status).toBe(200);
    expect(body.status).toBe('DONE');
  });

  it('transitions DONE → TODO (reopen)', async () => {
    const created = await createTask({ title: 'Reopen Test', status: 'DONE' });
    createdIds.push(created.id);

    const { status, body } = await api('PATCH', `/${created.id}/status`, {
      status: 'TODO',
    });
    expect(status).toBe(200);
    expect(body.status).toBe('TODO');
  });
});

/* ================================================================== */
/*  6. DELETE (DELETE /api/tasks/:id)                                   */
/* ================================================================== */

describe('Delete task', () => {
  it('deletes a task and returns 204', async () => {
    const created = await createTask({ title: 'Delete Me' });

    const { status } = await api('DELETE', `/${created.id}`);
    expect(status).toBe(204);

    // Confirm it's gone
    const { status: getStatus } = await api('GET', `/${created.id}`);
    expect(getStatus).toBe(404);
  });

  it('returns 404 when deleting a non-existent task', async () => {
    const { status } = await api('DELETE', '/999999');
    expect(status).toBe(404);
  });
});

/* ================================================================== */
/*  7. LIST WITH FILTERS (GET /api/tasks?status=&priority=&assignee=)  */
/* ================================================================== */

describe('List and filter tasks', () => {
  let taskA, taskB, taskC;

  beforeAll(async () => {
    taskA = await createTask({
      title: 'Filter A',
      status: 'TODO',
      priority: 'HIGH',
      assignee: 'Alice',
    });
    createdIds.push(taskA.id);

    taskB = await createTask({
      title: 'Filter B',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      assignee: 'Bob',
    });
    createdIds.push(taskB.id);

    taskC = await createTask({
      title: 'Filter C',
      status: 'TODO',
      priority: 'HIGH',
      assignee: 'Alice',
    });
    createdIds.push(taskC.id);
  });

  it('lists all tasks', async () => {
    const { status, body } = await api('GET', '');
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  it('filters by status', async () => {
    const { status, body } = await api('GET', '?status=TODO');
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(2);
    body.forEach((t) => expect(t.status).toBe('TODO'));
  });

  it('filters by priority', async () => {
    const { status, body } = await api('GET', '?priority=HIGH');
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(2);
    body.forEach((t) => expect(t.priority).toBe('HIGH'));
  });

  it('filters by assignee', async () => {
    const { status, body } = await api('GET', '?assignee=Alice');
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(2);
    body.forEach((t) => expect(t.assignee).toBe('Alice'));
  });
});

/* ================================================================== */
/*  8. FULL LIFECYCLE — create → read → update → status → delete       */
/* ================================================================== */

describe('Full task lifecycle', () => {
  it('completes a full CRUD + status lifecycle', async () => {
    // 1. Create
    const created = await createTask({
      title: 'Lifecycle Task',
      description: 'Full lifecycle test',
      status: 'TODO',
      priority: 'LOW',
      assignee: 'Lifecycle Tester',
    });
    expect(created.id).toBeDefined();

    // 2. Read
    const { body: read } = await api('GET', `/${created.id}`);
    expect(read.title).toBe('Lifecycle Task');

    // 3. Update
    const { body: updated } = await api('PUT', `/${created.id}`, {
      title: 'Lifecycle Task — Updated',
      priority: 'HIGH',
    });
    expect(updated.title).toBe('Lifecycle Task — Updated');
    expect(updated.priority).toBe('HIGH');

    // 4. Status transition: TODO → IN_PROGRESS → DONE
    const { body: inProgress } = await api('PATCH', `/${created.id}/status`, {
      status: 'IN_PROGRESS',
    });
    expect(inProgress.status).toBe('IN_PROGRESS');

    const { body: done } = await api('PATCH', `/${created.id}/status`, {
      status: 'DONE',
    });
    expect(done.status).toBe('DONE');

    // 5. Delete
    const { status: delStatus } = await api('DELETE', `/${created.id}`);
    expect(delStatus).toBe(204);

    // 6. Confirm gone
    const { status: goneStatus } = await api('GET', `/${created.id}`);
    expect(goneStatus).toBe(404);
  });
});
