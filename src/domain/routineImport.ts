import type { ParseRoutineResult, ParserError, RoutineBlock } from '@/domain/types';
import { createSetExpandedBlocks } from '@/domain/routineBlocks';

export type ParseRoutineOptions = {
  now?: string;
  createId?: (prefix: string) => string;
};

let localIdCounter = 0;

export function createLocalId(prefix: string): string {
  localIdCounter += 1;

  return `${prefix}_${Date.now().toString(36)}_${localIdCounter.toString(36)}`;
}

export function parseRoutineImport(input: string, options: ParseRoutineOptions = {}): ParseRoutineResult {
  const now = options.now ?? new Date().toISOString();
  const createId = options.createId ?? createLocalId;
  const errors: ParserError[] = [];
  const blocks: RoutineBlock[] = [];
  let routineName = 'Imported Routine';
  let description: string | undefined;

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      return;
    }

    const fields = rawLine.split('|').map((field) => field.trim());
    const keyword = fields[0].toUpperCase();

    switch (keyword) {
      case 'ROUTINE': {
        const name = joinFields(fields, 1);

        if (!name) {
          addError(errors, lineNumber, 'ROUTINE name is required.', rawLine);
          return;
        }

        routineName = name;
        return;
      }
      case 'DESCRIPTION':
        description = joinFields(fields, 1) || undefined;
        return;
      case 'TIME':
        parseTimeBlock(fields, lineNumber, rawLine, errors, blocks, createId);
        return;
      case 'REPS':
        parseRepsBlock(fields, lineNumber, rawLine, errors, blocks, createId);
        return;
      case 'OPEN':
        parseOpenBlock(fields, lineNumber, rawLine, errors, blocks, createId);
        return;
      case 'REST':
        parseRestBlock(fields, lineNumber, rawLine, errors, blocks, createId);
        return;
      default:
        addError(errors, lineNumber, `Unknown routine import keyword "${fields[0]}".`, rawLine);
    }
  });

  if (blocks.length === 0) {
    errors.push({
      lineNumber: 0,
      message: 'A routine must contain at least one routine block.',
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    routine: {
      id: createId('routine'),
      name: routineName,
      description,
      blocks,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function parseTimeBlock(
  fields: string[],
  lineNumber: number,
  rawLine: string,
  errors: ParserError[],
  blocks: RoutineBlock[],
  createId: (prefix: string) => string
) {
  const name = fields[1] ?? '';
  const durationSeconds = parsePositiveInteger(fields[2], 'TIME durationSeconds');
  const sets = fields[3] ? parsePositiveInteger(fields[3], 'TIME sets') : 1;
  const restAndNotes = parseOptionalRestBetweenSets(fields, 4, 'TIME restBetweenSetsSeconds');

  if (!name) {
    addError(errors, lineNumber, 'TIME name is required.', rawLine);
  }

  addIntegerError(errors, lineNumber, rawLine, durationSeconds);
  addIntegerError(errors, lineNumber, rawLine, sets);
  addIntegerError(errors, lineNumber, rawLine, restAndNotes.restBetweenSetsSeconds);

  if (!name || typeof durationSeconds !== 'number' || typeof sets !== 'number') {
    return;
  }

  blocks.push(
    ...createSetExpandedBlocks({
      type: 'time',
      name,
      orderStart: blocks.length + 1,
      durationSeconds,
      sets,
      restBetweenSetsSeconds:
        typeof restAndNotes.restBetweenSetsSeconds === 'number'
          ? restAndNotes.restBetweenSetsSeconds
          : undefined,
      notes: restAndNotes.notes || undefined,
      createId,
    })
  );
}

function parseRepsBlock(
  fields: string[],
  lineNumber: number,
  rawLine: string,
  errors: ParserError[],
  blocks: RoutineBlock[],
  createId: (prefix: string) => string
) {
  const name = fields[1] ?? '';
  const reps = parsePositiveInteger(fields[2], 'REPS reps');
  const sets = fields[3] ? parsePositiveInteger(fields[3], 'REPS sets') : 1;
  const restAndNotes = parseOptionalRestBetweenSets(fields, 4, 'REPS restBetweenSetsSeconds');

  if (!name) {
    addError(errors, lineNumber, 'REPS name is required.', rawLine);
  }

  addIntegerError(errors, lineNumber, rawLine, reps);
  addIntegerError(errors, lineNumber, rawLine, sets);
  addIntegerError(errors, lineNumber, rawLine, restAndNotes.restBetweenSetsSeconds);

  if (!name || typeof reps !== 'number' || typeof sets !== 'number') {
    return;
  }

  blocks.push(
    ...createSetExpandedBlocks({
      type: 'reps',
      name,
      orderStart: blocks.length + 1,
      reps,
      sets,
      restBetweenSetsSeconds:
        typeof restAndNotes.restBetweenSetsSeconds === 'number'
          ? restAndNotes.restBetweenSetsSeconds
          : undefined,
      notes: restAndNotes.notes || undefined,
      createId,
    })
  );
}

function parseOpenBlock(
  fields: string[],
  lineNumber: number,
  rawLine: string,
  errors: ParserError[],
  blocks: RoutineBlock[],
  createId: (prefix: string) => string
) {
  const name = fields[1] ?? '';

  if (!name) {
    addError(errors, lineNumber, 'OPEN name is required.', rawLine);
    return;
  }

  blocks.push({
    id: createId('block'),
    type: 'open',
    name,
    order: blocks.length + 1,
    notes: joinFields(fields, 2) || undefined,
  });
}

function parseRestBlock(
  fields: string[],
  lineNumber: number,
  rawLine: string,
  errors: ParserError[],
  blocks: RoutineBlock[],
  createId: (prefix: string) => string
) {
  const name = fields[1] || 'Rest';
  const durationSeconds = parsePositiveInteger(fields[2], 'REST durationSeconds');

  addIntegerError(errors, lineNumber, rawLine, durationSeconds);

  if (typeof durationSeconds !== 'number') {
    return;
  }

  blocks.push({
    id: createId('block'),
    type: 'rest',
    name,
    order: blocks.length + 1,
    durationSeconds,
    notes: joinFields(fields, 3) || undefined,
  });
}

function joinFields(fields: string[], startIndex: number) {
  return fields.slice(startIndex).join(' | ').trim();
}

function parseOptionalRestBetweenSets(fields: string[], startIndex: number, label: string) {
  const firstOptionalField = fields[startIndex];

  if (!firstOptionalField) {
    return {
      notes: undefined,
      restBetweenSetsSeconds: undefined,
    };
  }

  if (/^\d+$/.test(firstOptionalField)) {
    return {
      notes: joinFields(fields, startIndex + 1) || undefined,
      restBetweenSetsSeconds: parsePositiveInteger(firstOptionalField, label),
    };
  }

  return {
    notes: joinFields(fields, startIndex) || undefined,
    restBetweenSetsSeconds: undefined,
  };
}

function parsePositiveInteger(rawValue: string | undefined, label: string) {
  if (!rawValue) {
    return `${label} is required.`;
  }

  if (!/^\d+$/.test(rawValue)) {
    return `${label} must be a positive integer.`;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    return `${label} must be a positive integer.`;
  }

  return value;
}

function addIntegerError(
  errors: ParserError[],
  lineNumber: number,
  rawLine: string,
  value: number | string | undefined
) {
  if (typeof value === 'string') {
    addError(errors, lineNumber, value, rawLine);
  }
}

function addError(errors: ParserError[], lineNumber: number, message: string, lineText: string) {
  errors.push({
    lineNumber,
    message,
    lineText,
  });
}
