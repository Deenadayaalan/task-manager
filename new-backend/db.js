const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'taskflow.db');

/**
 * Thin wrapper around sql.js that exposes a better-sqlite3-compatible
 * synchronous API so the rest of the codebase stays unchanged.
 */
class DatabaseWrapper {
  constructor(db) {
    this._db = db;
    this._inTransaction = false;
  }

  /** Run a raw SQL string (CREATE TABLE, etc.) */
  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  /** Set a pragma value */
  pragma(value) {
    try {
      this._db.run(`PRAGMA ${value}`);
    } catch (_) {
      // sql.js doesn't support all pragmas — ignore
    }
  }

  /**
   * Return a statement-like object with .all(), .get(), .run() methods.
   */
  prepare(sql) {
    const db = this._db;
    const self = this;

    return {
      /** Return all matching rows as an array of plain objects */
      all(...params) {
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },

      /** Return the first matching row as a plain object, or undefined */
      get(...params) {
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        let row;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },

      /** Execute a write statement; return { changes, lastInsertRowid } */
      run(...params) {
        db.run(sql, params);
        const changes = db.getRowsModified();
        const lastRow = db.exec('SELECT last_insert_rowid() AS id');
        const lastInsertRowid =
          lastRow.length > 0 ? lastRow[0].values[0][0] : 0;
        if (!self._inTransaction) {
          self._save();
        }
        return { changes, lastInsertRowid };
      },
    };
  }

  /**
   * Wrap a function in a transaction (BEGIN / COMMIT / ROLLBACK).
   */
  transaction(fn) {
    const self = this;
    return function (...args) {
      self._db.run('BEGIN');
      self._inTransaction = true;
      try {
        const result = fn(...args);
        self._db.run('COMMIT');
        self._inTransaction = false;
        self._save();
        return result;
      } catch (err) {
        self._inTransaction = false;
        try {
          self._db.run('ROLLBACK');
        } catch (_) {
          // ignore rollback errors
        }
        throw err;
      }
    };
  }

  /** Persist the in-memory database to disk */
  _save() {
    const data = this._db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

let _db;

function getDb() {
  if (_db) return _db;
  throw new Error('Database not initialised — call initDb() first');
}

async function initDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();

  let sqliteDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  const wrapper = new DatabaseWrapper(sqliteDb);

  wrapper.pragma('journal_mode = WAL');

  // Create tasks table if it doesn't exist
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'TODO',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      assignee TEXT,
      dueDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  _db = wrapper;
  return _db;
}

module.exports = { getDb, initDb };
