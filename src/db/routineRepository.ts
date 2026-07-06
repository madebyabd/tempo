import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase, initializeDatabase as initializeLocalDatabase } from '@/db/database';
import type { Routine, RoutineBlock, RoutineSummary } from '@/domain/types';

type RoutineRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type RoutineSummaryRow = RoutineRow & {
  block_count: number;
};

type RoutineBlockRow = {
  id: string;
  routine_id: string;
  type: string;
  name: string;
  block_order: number;
  notes: string | null;
  duration_seconds: number | null;
  reps: number | null;
  set_number: number | null;
  total_sets: number | null;
  source_exercise_id: string | null;
  rest_between_sets_seconds: number | null;
  created_at: string;
  updated_at: string;
};

export async function initializeDatabase() {
  try {
    await initializeLocalDatabase();
  } catch (error) {
    throw new Error(`Unable to initialize TEMPO database: ${getErrorMessage(error)}`);
  }
}

export async function saveRoutine(routine: Routine) {
  const db = await getReadyDatabase('save routine');
  const normalizedRoutine = normalizeRoutine(routine);

  try {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await upsertRoutine(tx, normalizedRoutine);
      await replaceRoutineBlocks(tx, normalizedRoutine);
    });
  } catch (error) {
    throw new Error(`Unable to save routine: ${getErrorMessage(error)}`);
  }
}

export async function updateRoutine(routine: Routine) {
  const db = await getReadyDatabase('update routine');
  const normalizedRoutine = normalizeRoutine(routine);

  try {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await upsertRoutine(tx, normalizedRoutine);
      await replaceRoutineBlocks(tx, normalizedRoutine);
    });
  } catch (error) {
    throw new Error(`Unable to update routine: ${getErrorMessage(error)}`);
  }
}

export async function getAllRoutines(): Promise<RoutineSummary[]> {
  const db = await getReadyDatabase('load routines');

  try {
    const rows = await db.getAllAsync<RoutineSummaryRow>(`
      SELECT
        routines.id,
        routines.name,
        routines.description,
        routines.created_at,
        routines.updated_at,
        COUNT(routine_blocks.id) AS block_count
      FROM routines
      LEFT JOIN routine_blocks ON routine_blocks.routine_id = routines.id
      GROUP BY routines.id
      ORDER BY routines.updated_at DESC
    `);

    return rows.map(toRoutineSummary);
  } catch (error) {
    throw new Error(`Unable to load routines: ${getErrorMessage(error)}`);
  }
}

export async function getRoutineById(id: string): Promise<Routine | null> {
  const db = await getReadyDatabase('load routine');

  try {
    const routineRow = await db.getFirstAsync<RoutineRow>(
      'SELECT * FROM routines WHERE id = ?',
      id
    );

    if (!routineRow) {
      return null;
    }

    const blockRows = await db.getAllAsync<RoutineBlockRow>(
      'SELECT * FROM routine_blocks WHERE routine_id = ? ORDER BY block_order ASC',
      id
    );

    return toRoutine(routineRow, blockRows);
  } catch (error) {
    throw new Error(`Unable to load routine: ${getErrorMessage(error)}`);
  }
}

export async function deleteRoutine(id: string) {
  const db = await getReadyDatabase('delete routine');

  try {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync('DELETE FROM routine_blocks WHERE routine_id = ?', id);
      await tx.runAsync('DELETE FROM routines WHERE id = ?', id);
    });
  } catch (error) {
    throw new Error(`Unable to delete routine: ${getErrorMessage(error)}`);
  }
}

async function getReadyDatabase(action: string) {
  try {
    await initializeLocalDatabase();
    return await getDatabase();
  } catch (error) {
    throw new Error(`Unable to ${action}: ${getErrorMessage(error)}`);
  }
}

function normalizeRoutine(routine: Routine): Routine {
  const now = new Date().toISOString();
  const createdAt = routine.createdAt || now;
  const updatedAt = routine.updatedAt || now;

  return {
    ...routine,
    name: routine.name.trim(),
    description: routine.description?.trim() || undefined,
    createdAt,
    updatedAt,
    blocks: routine.blocks.map((block, index) => ({
      ...block,
      order: index + 1,
    })),
  };
}

async function upsertRoutine(db: SQLiteDatabase, routine: Routine) {
  await db.runAsync(
    `
      INSERT INTO routines (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        updated_at = excluded.updated_at
    `,
    routine.id,
    routine.name,
    routine.description ?? null,
    routine.createdAt,
    routine.updatedAt
  );
}

async function replaceRoutineBlocks(db: SQLiteDatabase, routine: Routine) {
  await db.runAsync('DELETE FROM routine_blocks WHERE routine_id = ?', routine.id);

  for (const block of routine.blocks) {
    await db.runAsync(
      `
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      block.id,
      routine.id,
      block.type,
      block.name,
      block.order,
      block.notes ?? null,
      'durationSeconds' in block ? block.durationSeconds : null,
      'reps' in block ? block.reps : null,
      'setNumber' in block ? block.setNumber : null,
      'totalSets' in block ? block.totalSets : null,
      block.sourceExerciseId ?? null,
      block.restBetweenSetsSeconds ?? null,
      routine.createdAt,
      routine.updatedAt
    );
  }
}

function toRoutineSummary(row: RoutineSummaryRow): RoutineSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    blockCount: row.block_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRoutine(row: RoutineRow, blockRows: RoutineBlockRow[]): Routine {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    blocks: blockRows.map(toRoutineBlock),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRoutineBlock(row: RoutineBlockRow): RoutineBlock {
  const base = {
    id: row.id,
    type: row.type,
    name: row.name,
    order: row.block_order,
    notes: row.notes ?? undefined,
    sourceExerciseId: row.source_exercise_id ?? undefined,
    restBetweenSetsSeconds: row.rest_between_sets_seconds ?? undefined,
  };

  if (row.type === 'reps') {
    return {
      ...base,
      type: 'reps',
      reps: row.reps ?? 1,
      sets: 1,
      setNumber: row.set_number ?? 1,
      totalSets: row.total_sets ?? 1,
    };
  }

  if (row.type === 'time') {
    return {
      ...base,
      type: 'time',
      durationSeconds: row.duration_seconds ?? 1,
      sets: 1,
      setNumber: row.set_number ?? 1,
      totalSets: row.total_sets ?? 1,
    };
  }

  if (row.type === 'rest') {
    return {
      ...base,
      type: 'rest',
      durationSeconds: row.duration_seconds ?? 1,
      isInterSetRest: Boolean(row.source_exercise_id),
    };
  }

  throw new Error(`Unsupported routine block type "${row.type}".`);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
