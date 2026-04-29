const { getDb } = require('../db');

/**
 * Find all tasks, optionally filtered by status, priority, assignee, and/or search term.
 */
function findAll(filters = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.priority) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }
  if (filters.assignee) {
    conditions.push('assignee = ?');
    params.push(filters.assignee);
  }
  if (filters.search) {
    conditions.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)');
    const searchTerm = `%${filters.search.toLowerCase()}%`;
    params.push(searchTerm, searchTerm);
  }

  let sql = 'SELECT * FROM tasks';
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY id ASC';

  return db.prepare(sql).all(...params);
}

/**
 * Find a single task by ID.
 */
function findById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) || null;
}

/**
 * Create a new task.
 */
function create(data) {
  const db = getDb();
  const now = new Date().toISOString();
  const status = data.status || 'TODO';
  const priority = data.priority || 'MEDIUM';

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, assignee, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.description || null,
    status,
    priority,
    data.assignee || null,
    data.dueDate || null,
    now,
    now
  );

  return findById(result.lastInsertRowid);
}

/**
 * Partial update — only updates fields that are provided (non-undefined).
 */
function update(id, data) {
  const db = getDb();
  const existing = findById(id);
  if (!existing) return null;

  const fields = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate'];
  const setClauses = [];
  const params = [];

  for (const field of fields) {
    if (data[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  setClauses.push('updatedAt = ?');
  const now = new Date().toISOString();
  params.push(now);

  params.push(id);

  db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  return findById(id);
}

/**
 * Update only the status field of a task.
 */
function updateStatus(id, status) {
  const db = getDb();
  const existing = findById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);

  return findById(id);
}

/**
 * Delete a task by ID.
 */
function remove(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Return the total number of tasks.
 */
function count() {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
  return row.count;
}

/**
 * Update status for multiple tasks at once.
 */
function bulkUpdateStatus(taskIds, status) {
  const db = getDb();
  if (!taskIds || taskIds.length === 0) return 0;
  const now = new Date().toISOString();
  const placeholders = taskIds.map(() => '?').join(', ');
  const stmt = db.prepare(
    `UPDATE tasks SET status = ?, updatedAt = ? WHERE id IN (${placeholders})`
  );
  const result = stmt.run(status, now, ...taskIds);
  return result.changes;
}

/**
 * Delete multiple tasks at once.
 */
function bulkDelete(taskIds) {
  const db = getDb();
  if (!taskIds || taskIds.length === 0) return 0;
  const placeholders = taskIds.map(() => '?').join(', ');
  const stmt = db.prepare(`DELETE FROM tasks WHERE id IN (${placeholders})`);
  const result = stmt.run(...taskIds);
  return result.changes;
}

module.exports = { findAll, findById, create, update, updateStatus, delete: remove, count, bulkUpdateStatus, bulkDelete };
