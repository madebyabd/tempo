import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { applySchema, DATABASE_NAME } from '@/db/schema';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await applySchema(db);
      return db;
    });
  }

  return databasePromise;
}

export async function initializeDatabase() {
  await getDatabase();
}
