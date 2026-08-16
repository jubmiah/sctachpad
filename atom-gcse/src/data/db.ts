/**
 * On-device SQLite storage.
 *
 * Only learner progress lives here — the curriculum and question bank are bundled with
 * the app. Migrations are applied in order using SQLite's `user_version` pragma, so an
 * existing install upgrades without losing progress.
 */

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'atom-gcse.db';

/** Each entry is one migration; the array index + 1 is the resulting schema version. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS learner (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    tier          TEXT    NOT NULL DEFAULT 'foundation',
    target_grade  INTEGER NOT NULL DEFAULT 5,
    xp            INTEGER NOT NULL DEFAULT 0,
    streak_days   INTEGER NOT NULL DEFAULT 0,
    last_active_day TEXT
  );

  CREATE TABLE IF NOT EXISTS topic_ability (
    topic_id          TEXT    PRIMARY KEY,
    theta             REAL    NOT NULL,
    information       REAL    NOT NULL DEFAULT 0,
    attempts          INTEGER NOT NULL DEFAULT 0,
    correct           INTEGER NOT NULL DEFAULT 0,
    last_practiced_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id  TEXT    NOT NULL,
    topic_id     TEXT    NOT NULL,
    correct      INTEGER NOT NULL,
    response_ms  INTEGER NOT NULL,
    used_hint    INTEGER NOT NULL,
    answered_at  INTEGER NOT NULL,
    theta_before REAL    NOT NULL,
    theta_after  REAL    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_attempts_topic ON attempts (topic_id, answered_at DESC);

  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id    TEXT    NOT NULL,
    started_at  INTEGER NOT NULL,
    finished_at INTEGER,
    total       INTEGER NOT NULL DEFAULT 0,
    correct     INTEGER NOT NULL DEFAULT 0,
    xp_earned   INTEGER NOT NULL DEFAULT 0
  );
  `,
];

let database: SQLite.SQLiteDatabase | null = null;

/** Open the database, applying any pending migrations. Safe to call repeatedly. */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);

  database = db;
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  for (let i = version; i < MIGRATIONS.length; i++) {
    await db.execAsync(MIGRATIONS[i]);
    version = i + 1;
    // PRAGMA does not accept bound parameters, and version is a loop counter, not input.
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }

  await db.runAsync(
    'INSERT OR IGNORE INTO learner (id, tier, target_grade) VALUES (1, ?, ?)',
    'foundation',
    5,
  );
}

/** Drop all progress. Used by the "reset progress" action in settings. */
export async function resetProgress(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM attempts;
    DELETE FROM sessions;
    DELETE FROM topic_ability;
    UPDATE learner SET xp = 0, streak_days = 0, last_active_day = NULL WHERE id = 1;
  `);
}
