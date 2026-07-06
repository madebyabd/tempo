export type RoutineBlockType = 'time' | 'reps' | 'open' | 'rest';

export interface BaseRoutineBlock {
  id: string;
  type: RoutineBlockType;
  name: string;
  order: number;
  notes?: string;
}

export interface TimeExerciseBlock extends BaseRoutineBlock {
  type: 'time';
  durationSeconds: number;
  sets: number;
  setNumber: number;
  totalSets: number;
}

export interface RepsExerciseBlock extends BaseRoutineBlock {
  type: 'reps';
  reps: number;
  sets: number;
  setNumber: number;
  totalSets: number;
}

export interface OpenExerciseBlock extends BaseRoutineBlock {
  type: 'open';
}

export interface RestBlock extends BaseRoutineBlock {
  type: 'rest';
  durationSeconds: number;
  isInterSetRest?: boolean;
}

export type RoutineBlock = TimeExerciseBlock | RepsExerciseBlock | OpenExerciseBlock | RestBlock;

export interface Routine {
  id: string;
  name: string;
  description?: string;
  blocks: RoutineBlock[];
  createdAt: string;
  updatedAt: string;
}

export type WorkoutSessionStatus = 'ready' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  routineSnapshot: Routine;
  status: WorkoutSessionStatus;
  currentBlockOrder: number;
  currentSet?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParserError {
  lineNumber: number;
  message: string;
  lineText?: string;
}

export type ParseRoutineResult =
  | {
      success: true;
      routine: Routine;
    }
  | {
      success: false;
      errors: ParserError[];
    };
