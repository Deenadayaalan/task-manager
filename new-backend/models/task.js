const db = require('../db');

/**
 * Find all tasks, optionally filtered by status, priority, assignee, and/or search term.
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.status]
 * @param {string} [filters.priority]
 * @param {string} [filters.assignee]
 * @param {string} [filters.search] - Full-text search across title and description
 * @returns {Array} List of task objects
 */
function findAll(filters = {}) {
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
 * @param {number} id
 * @returns {Object|undefined} Task object or undefined if not found
 */
function findById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) || null;
}

/**
 * Create a new task.
 * @param {Object} data - Task fields (title required; description, status, priority, assignee, dueDate optional)
 * @returns {Object} The created task
 */
function create(data) {
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
 * @param {number} id
 * @param {Object} data - Fields to update
 * @returns {Object|null} Updated task or null if not found
 */
function update(id, data) {
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

  // Always update updatedAt
  setClauses.push('updatedAt = ?');
  const now = new Date().toISOString();
  params.push(now);

  params.push(id);

  db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  return findById(id);
}

/**
 * Update only the status field of a task.
 * @param {number} id
 * @param {string} status - New status value
 * @returns {Object|null} Updated task or null if not found
 */
function updateStatus(id, status) {
  const existing = findById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);

  return findById(id);
}

/**
 * Delete a task by ID.
 * @param {number} id
 * @returns {boolean} True if a row was deleted, false if not found
 */
function remove(id) {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Return the total number of tasks.
 * @returns {number}
 */
function count() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
  return row.count;
}

/**
 * Update status for multiple tasks at once.
 * @param {number[]} taskIds - Array of task IDs to update
 * @param {string} status - New status value
 * @returns {number} Number of rows updated
 */
function bulkUpdateStatus(taskIds, status) {
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
 * @param {number[]} taskIds - Array of task IDs to delete
 * @returns {number} Number of rows deleted
 */
function bulkDelete(taskIds) {
  if (!taskIds || taskIds.length === 0) return 0;
  const placeholders = taskIds.map(() => '?').join(', ');
  const stmt = db.prepare(`DELETE FROM tasks WHERE id IN (${placeholders})`);
  const result = stmt.run(...taskIds);
  return result.changes;
}

module.exports = { findAll, findById, create, update, updateStatus, delete: remove, count, bulkUpdateStatus, bulkDelete };
