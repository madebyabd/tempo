import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'tempo.db';
export const DATABASE_VERSION = 2;

const ROUTINES_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
`;

const ROUTINE_BLOCKS_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS routine_blocks (
      id TEXT PRIMARY KEY NOT NULL,
      routine_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('reps', 'time', 'rest')),
      name TEXT NOT NULL,
      block_order INTEGER NOT NULL,
      notes TEXT,
      duration_seconds INTEGER,
      reps INTEGER,
      set_number INTEGER,
      total_sets INTEGER,
      source_exercise_id TEXT,
      rest_between_sets_seconds INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
    );
`;

const ROUTINE_BLOCKS_INDEX_SQL = `
    CREATE INDEX IF NOT EXISTS routine_blocks_routine_order_idx
      ON routine_blocks (routine_id, block_order);
`;

export async function applySchema(db: SQLiteDatabase) {
  const currentVersion = await getDatabaseVersion(db);

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    ${ROUTINES_TABLE_SQL}
    ${ROUTINE_BLOCKS_TABLE_SQL}
    ${ROUTINE_BLOCKS_INDEX_SQL}
  `);

  if (currentVersion < DATABASE_VERSION) {
    await rebuildLegacyBlockSchemaIfNeeded(db);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}

async function getDatabaseVersion(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

  return row?.user_version ?? 0;
}

async function rebuildLegacyBlockSchemaIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  try {
    await db.execAsync(`
      DROP INDEX IF EXISTS routine_blocks_routine_order_idx;
      DROP TABLE IF EXISTS routine_blocks_legacy_backup;
      ALTER TABLE routine_blocks RENAME TO routine_blocks_legacy_backup;

      ${ROUTINE_BLOCKS_TABLE_SQL}

      INSERT INTO routine_blocks (
        id,
        routine_id,
        type,
        name,
        block_order,
        notes,
        duration_seconds,
        reps,
        set_number,
        total_sets,
        source_exercise_id,
        rest_between_sets_seconds,
        created_at,
        updated_at
      )
      SELECT
        id,
        routine_id,
        type,
        name,
        block_order,
        notes,
        duration_seconds,
        reps,
        set_number,
        total_sets,
        source_exercise_id,
        rest_between_sets_seconds,
        created_at,
        updated_at
      FROM routine_blocks_legacy_backup
      WHERE type IN ('reps', 'time', 'rest');

      DROP TABLE routine_blocks_legacy_backup;

      ${ROUTINE_BLOCKS_INDEX_SQL}
    `);
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}
