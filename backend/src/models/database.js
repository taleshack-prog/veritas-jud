'use strict';

/**
 * database.js — SQLite via sql.js (puro WebAssembly, sem build tools)
 *
 * sql.js mantém o banco em memória e faz flush para disco via fs.writeFileSync.
 * Para produção com alto volume, migrar para PostgreSQL ou libSQL (Turso).
 */

const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');
const logger    = require('../services/logger');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '../../database/veritas.db');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let _db   = null;
let _SQL  = null;

// ── Persistência: grava o banco em disco após cada escrita ─
function persist() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Persiste automaticamente a cada 5 segundos se houve mudanças
setInterval(persist, 5000).unref();

// Persiste ao encerrar o processo
process.on('exit',    persist);
process.on('SIGINT',  () => { persist(); process.exit(0); });
process.on('SIGTERM', () => { persist(); process.exit(0); });

// ── Schema SQL ─────────────────────────────────────────────
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'consumer',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  company     TEXT NOT NULL,
  amount      REAL,
  status      TEXT NOT NULL DEFAULT 'open',
  analysis    TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  type         TEXT NOT NULL,
  name         TEXT NOT NULL,
  content      TEXT NOT NULL,
  signed       INTEGER DEFAULT 0,
  signed_by    TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id           TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  channel      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  protocol     TEXT,
  response     TEXT,
  submitted_at TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lawyers (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  oab_number    TEXT UNIQUE NOT NULL,
  state         TEXT NOT NULL,
  specialties   TEXT NOT NULL,
  bio           TEXT,
  rating        REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  active        INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id           TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  lawyer_id    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent',
  price        REAL NOT NULL,
  accepted_at  TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_documents_complaint ON documents(complaint_id);
`;

// ── API compatível (simula better-sqlite3 síncrono) ───────
/**
 * Adaptador que expõe .prepare(sql).run(...) / .get(...) / .all(...)
 * sobre o sql.js assíncrono mas de forma síncrona (tudo em memória).
 */
function makeAdapter(db) {
  return {
    prepare(sql) {
      return {
        run(...params) {
          db.run(sql, params);
          persist();
          // Retorna lastID via SELECT last_insert_rowid()
          const [[id]] = db.exec('SELECT last_insert_rowid()')[0]?.values || [[0]];
          return { lastID: id, changes: db.getRowsModified() };
        },
        get(...params) {
          const stmt   = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        },
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },
    exec(sql) {
      db.run(sql);
    },
  };
}

// ── Inicializa DB ──────────────────────────────────────────
async function initDB() {
  _SQL = await initSqlJs();

  // Carrega banco existente ou cria novo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new _SQL.Database(fileBuffer);
    logger.info(`✅ Banco SQLite carregado de ${DB_PATH}`);
  } else {
    _db = new _SQL.Database();
    logger.info(`✅ Banco SQLite novo criado em ${DB_PATH}`);
  }

  // Aplica schema
  _db.run(SCHEMA);
  persist();

  return getDB();
}

function getDB() {
  if (!_db) throw new Error('Banco não inicializado. Chame initDB() primeiro.');
  return makeAdapter(_db);
}

module.exports = { initDB, getDB };
