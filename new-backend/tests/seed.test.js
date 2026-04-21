import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, 'test-seed-taskflow.db');

// Set DB_PATH before requiring any app modules
process.env.DB_PATH = TEST_DB_PATH;

// Clean up any leftover test DB
for (const suffix of ['', '-shm', '-wal']) {
  const f = TEST_DB_PATH + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

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

// Expected seed task titles matching DataSeeder.java exactly
const EXPECTED_SEED_TITLES = [
  'Set up project repository',
  'Design database schema',
  'Implement user authentication',
  'Build REST API endpoints',
  'Create task board UI',
  'Add search and filtering',
  'Write unit tests',
  'Set up monitoring and logging',
  'Performance optimization',
  'Write API documentation',
];

afterAll(() => {
  for (const suffix of ['', '-shm', '-wal']) {
    const f = TEST_DB_PATH + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

// ─── 12.2 Seed Data Validation and Status Update Tests ──────────────────────

describe('12.2 — Seed Data Validation and Status Update Tests', () => {
  let seedTasks;

  beforeAll(async () => {
    const res = await request.get('/api/tasks');
    seedTasks = res.body;
  });

  // 1. Verify the seed data has exactly 10 tasks
  it('seed data has exactly 10 tasks', () => {
    expect(seedTasks).toHaveLength(10);
  });

  // 2. Verify seed data distribution: 2 DONE, 3 IN_PROGRESS, 5 TODO
  it('seed data has correct status distribution: 2 DONE, 3 IN_PROGRESS, 5 TODO', () => {
    const done = seedTasks.filter((t) => t.status === 'DONE');
    const inProgress = seedTasks.filter((t) => t.status === 'IN_PROGRESS');
    const todo = seedTasks.filter((t) => t.status === 'TODO');

    expect(done).toHaveLength(2);
    expect(inProgress).toHaveLength(3);
    expect(todo).toHaveLength(5);
  });

  // 3. Verify seed task titles match the original DataSeeder.java
  it('seed task titles match the original DataSeeder.java', () => {
    const titles = seedTasks.map((t) => t.title);
    for (const expected of EXPECTED_SEED_TITLES) {
      expect(titles).toContain(expected);
    }
    // Also verify no extra titles
    expect(titles).toHaveLength(EXPECTED_SEED_TITLES.length);
  });

  // 4. Test status update flow (simulating drag-and-drop): TODO → IN_PROGRESS → DONE
  it('status update flow: PATCH a task from TODO → IN_PROGRESS → DONE', async () => {
    // Find a TODO task
    const todoTask = seedTasks.find((t) => t.status === 'TODO');
    expect(todoTask).toBeDefined();

    // Move to IN_PROGRESS
    const res1 = await request
      .patch(`/api/tasks/${todoTask.id}/status`)
      .send({ status: 'IN_PROGRESS' });
    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe('IN_PROGRESS');
    expect(res1.body.id).toBe(todoTask.id);

    // Move to DONE
    const res2 = await request
      .patch(`/api/tasks/${todoTask.id}/status`)
      .send({ status: 'DONE' });
    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('DONE');
    expect(res2.body.id).toBe(todoTask.id);
  });

  // 5. Verify the status change persists (GET the task after PATCH)
  it('status change persists after PATCH (GET returns updated status)', async () => {
    // Find a TODO task (different from the one used above)
    const todoTasks = seedTasks.filter((t) => t.status === 'TODO');
    const todoTask = todoTasks[todoTasks.length - 1]; // pick the last one
    expect(todoTask).toBeDefined();

    // PATCH to IN_PROGRESS
    await request
      .patch(`/api/tasks/${todoTask.id}/status`)
      .send({ status: 'IN_PROGRESS' });

    // GET the task and verify status persisted
    const res = await request.get(`/api/tasks/${todoTask.id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
    expect(res.body.id).toBe(todoTask.id);
    expect(res.body.title).toBe(todoTask.title);
  });
});
