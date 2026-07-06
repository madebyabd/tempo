import type { RoutineBlock } from '@/domain/types';

type CreateId = (prefix: string) => string;

type RepsSetExpansionInput = {
  type: 'reps';
  name: string;
  reps: number;
  sets: number;
  notes?: string;
  restBetweenSetsSeconds?: number;
  orderStart: number;
  createId: CreateId;
};

type TimeSetExpansionInput = {
  type: 'time';
  name: string;
  durationSeconds: number;
  sets: number;
  notes?: string;
  restBetweenSetsSeconds?: number;
  orderStart: number;
  createId: CreateId;
};

export type SetExpansionInput = RepsSetExpansionInput | TimeSetExpansionInput;

export function createSetExpandedBlocks(input: SetExpansionInput): RoutineBlock[] {
  const blocks: RoutineBlock[] = [];
  let order = input.orderStart;

  for (let setNumber = 1; setNumber <= input.sets; setNumber += 1) {
    if (input.type === 'reps') {
      blocks.push({
        id: input.createId('block'),
        type: 'reps',
        name: input.name,
        order,
        reps: input.reps,
        sets: 1,
        setNumber,
        totalSets: input.sets,
        notes: input.notes,
      });
    } else {
      blocks.push({
        id: input.createId('block'),
        type: 'time',
        name: input.name,
        order,
        durationSeconds: input.durationSeconds,
        sets: 1,
        setNumber,
        totalSets: input.sets,
        notes: input.notes,
      });
    }

    order += 1;

    if (input.restBetweenSetsSeconds && setNumber < input.sets) {
      blocks.push({
        id: input.createId('block'),
        type: 'rest',
        name: 'Rest',
        order,
        durationSeconds: input.restBetweenSetsSeconds,
        isInterSetRest: true,
      });
      order += 1;
    }
  }

  return blocks;
}
