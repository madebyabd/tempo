import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import { saveRoutine } from '@/db/routineRepository';
import { createSetExpandedBlocks } from '@/domain/routineBlocks';
import { createLocalId, parseRoutineImport } from '@/domain/routineImport';
import { sampleRoutineText } from '@/domain/sampleRoutine';
import type {
  ParseRoutineResult,
  ParserError,
  Routine,
  RoutineBlock,
  RoutineBlockType,
} from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

type BuilderMode = 'manual' | 'import';

const blockTypes: RoutineBlockType[] = ['reps', 'time', 'rest'];
let draftBlockIdCounter = 0;

export default function RoutineBuilderScreen() {
  const [mode, setMode] = useState<BuilderMode>('manual');

  return (
    <Screen title="Routine Builder" subtitle="Build routines manually or paste a v1 import.">
      <ModeTabs activeMode={mode} onChange={setMode} />
      {mode === 'manual' ? <ManualBuilder /> : <TextImportBuilder />}
    </Screen>
  );
}

function ModeTabs({
  activeMode,
  onChange,
}: {
  activeMode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.segmentedControl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <SegmentButton
        active={activeMode === 'manual'}
        label="Manual Builder"
        onPress={() => onChange('manual')}
      />
      <SegmentButton
        active={activeMode === 'import'}
        label="Text Import"
        onPress={() => onChange('import')}
      />
    </View>
  );
}

function ManualBuilder() {
  const [routineName, setRoutineName] = useState('');
  const [description, setDescription] = useState('');
  const [blockType, setBlockType] = useState<RoutineBlockType>('reps');
  const [blockName, setBlockName] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('1');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [restBetweenSetsSeconds, setRestBetweenSetsSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  function handleBlockTypeChange(nextType: RoutineBlockType) {
    const previousType = blockType;

    setBlockType(nextType);
    setErrors([]);

    if (nextType === 'rest' && !blockName.trim()) {
      setBlockName('Rest');
    }

    if (previousType === 'rest' && nextType !== 'rest' && blockName.trim() === 'Rest') {
      setBlockName('');
    }
  }

  function handleAddBlock() {
    const result = buildRoutineBlock({
      type: blockType,
      name: blockName,
      reps,
      sets,
      durationSeconds,
      restBetweenSetsSeconds,
      notes,
      order: blocks.length + 1,
    });

    if (result.errors.length > 0) {
      setErrors(result.errors);
      setSaveMessage('');
      setSaveError('');
      return;
    }

    if (!result.blocks) {
      return;
    }

    setBlocks((currentBlocks) => [...currentBlocks, ...result.blocks]);
    setErrors([]);
    setSaveMessage('');
    setSaveError('');
    clearBlockFields(blockType);
  }

  function clearBlockFields(currentBlockType: RoutineBlockType) {
    setBlockName(currentBlockType === 'rest' ? 'Rest' : '');
    setReps('');
    setSets('1');
    setDurationSeconds('');
    setRestBetweenSetsSeconds('');
    setNotes('');
  }

  function handleRemoveBlock(blockId: string) {
    setBlocks((currentBlocks) =>
      currentBlocks
        .filter((block) => block.id !== blockId)
        .map((block, index) => ({
          ...block,
          order: index + 1,
        }))
    );
  }

  function handleClearBlocks() {
    setBlocks([]);
    setErrors([]);
    setSaveMessage('');
    setSaveError('');
  }

  async function handleSaveRoutine() {
    const trimmedRoutineName = routineName.trim();

    if (!trimmedRoutineName) {
      setSaveMessage('');
      setSaveError('Routine name is required before saving.');
      return;
    }

    if (blocks.length === 0) {
      setSaveMessage('');
      setSaveError('Add at least one block before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      const routine = createRoutineForSave({
        name: trimmedRoutineName,
        description,
        blocks,
      });

      await saveRoutine(routine);
      setSaveMessage(`Saved "${routine.name}" locally.`);
    } catch (error) {
      setSaveError(getReadableError(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <View style={styles.section}>
        <TextField
          label="Routine name"
          onChangeText={setRoutineName}
          placeholder="Beginner Strength"
          value={routineName}
        />
        <TextField
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="Simple starter workout"
          value={description}
        />
      </View>

      <View style={styles.section}>
        <TextLabel>Block type</TextLabel>
        <View style={styles.blockTypeGrid}>
          {blockTypes.map((type) => (
            <BlockTypeButton
              key={type}
              active={blockType === type}
              label={type.toUpperCase()}
              onPress={() => handleBlockTypeChange(type)}
            />
          ))}
        </View>

        <BlockFields
          blockName={blockName}
          blockType={blockType}
          durationSeconds={durationSeconds}
          notes={notes}
          reps={reps}
          restBetweenSetsSeconds={restBetweenSetsSeconds}
          sets={sets}
          setBlockName={setBlockName}
          setDurationSeconds={setDurationSeconds}
          setNotes={setNotes}
          setReps={setReps}
          setRestBetweenSetsSeconds={setRestBetweenSetsSeconds}
          setSets={setSets}
        />

        {errors.length > 0 && <ManualErrors errors={errors} />}

        <View style={styles.actionRow}>
          <Button title="Add Block" onPress={handleAddBlock} style={styles.actionButton} />
          <Button
            title="Clear All Blocks"
            variant="secondary"
            disabled={blocks.length === 0}
            onPress={handleClearBlocks}
            style={styles.actionButton}
          />
        </View>
      </View>

      <ManualPreview
        blocks={blocks}
        description={description}
        onRemoveBlock={handleRemoveBlock}
        routineName={routineName}
      />

      <SaveStatus message={saveMessage} error={saveError} />
      <Button title={isSaving ? 'Saving...' : 'Save Routine'} disabled={isSaving} onPress={handleSaveRoutine} />
    </>
  );
}

function BlockFields({
  blockName,
  blockType,
  durationSeconds,
  notes,
  reps,
  restBetweenSetsSeconds,
  sets,
  setBlockName,
  setDurationSeconds,
  setNotes,
  setReps,
  setRestBetweenSetsSeconds,
  setSets,
}: {
  blockName: string;
  blockType: RoutineBlockType;
  durationSeconds: string;
  notes: string;
  reps: string;
  restBetweenSetsSeconds: string;
  sets: string;
  setBlockName: (value: string) => void;
  setDurationSeconds: (value: string) => void;
  setNotes: (value: string) => void;
  setReps: (value: string) => void;
  setRestBetweenSetsSeconds: (value: string) => void;
  setSets: (value: string) => void;
}) {
  const shouldAskForInterSetRest =
    (blockType === 'reps' || blockType === 'time') && Number(sets) > 1;

  return (
    <View style={styles.fieldStack}>
      <TextField
        label="Name"
        onChangeText={setBlockName}
        placeholder={blockType === 'rest' ? 'Rest' : 'Push-ups'}
        value={blockName}
      />

      {blockType === 'reps' && (
        <View style={styles.fieldRow}>
          <TextField
            keyboardType="number-pad"
            label="Reps"
            onChangeText={setReps}
            placeholder="12"
            value={reps}
          />
          <TextField
            keyboardType="number-pad"
            label="Sets"
            onChangeText={setSets}
            placeholder="3"
            value={sets}
          />
        </View>
      )}

      {blockType === 'time' && (
        <View style={styles.fieldRow}>
          <TextField
            keyboardType="number-pad"
            label="Duration seconds"
            onChangeText={setDurationSeconds}
            placeholder="45"
            value={durationSeconds}
          />
          <TextField
            keyboardType="number-pad"
            label="Sets"
            onChangeText={setSets}
            placeholder="3"
            value={sets}
          />
        </View>
      )}

      {blockType === 'rest' && (
        <TextField
          keyboardType="number-pad"
          label="Duration seconds"
          onChangeText={setDurationSeconds}
          placeholder="60"
          value={durationSeconds}
        />
      )}

      {shouldAskForInterSetRest && (
        <TextField
          keyboardType="number-pad"
          label="Rest between sets"
          onChangeText={setRestBetweenSetsSeconds}
          placeholder="45"
          value={restBetweenSetsSeconds}
        />
      )}

      <TextField
        label="Notes"
        multiline
        onChangeText={setNotes}
        placeholder="Optional notes"
        value={notes}
      />
    </View>
  );
}

function ManualPreview({
  blocks,
  description,
  onRemoveBlock,
  routineName,
}: {
  blocks: RoutineBlock[];
  description: string;
  onRemoveBlock: (blockId: string) => void;
  routineName: string;
}) {
  const displayName = routineName.trim() || 'Untitled Routine';
  const displayDescription = description.trim();
  const blockCountText = blocks.length === 1 ? '1 block' : `${blocks.length} blocks`;

  return (
    <View style={styles.section}>
      <Card>
        <CardText
          title={displayName}
          description={displayDescription || 'No description'}
          meta={blockCountText}
        />
      </Card>

      {blocks.length === 0 ? (
        <Card>
          <CardText title="No blocks yet" description="Add the first block above." meta="Preview" />
        </Card>
      ) : (
        <BlockPreviewList blocks={blocks} onRemoveBlock={onRemoveBlock} />
      )}
    </View>
  );
}

function TextImportBuilder() {
  const theme = useTheme();
  const [importText, setImportText] = useState(sampleRoutineText);
  const [parseResult, setParseResult] = useState<ParseRoutineResult>(() =>
    parseRoutineImport(sampleRoutineText)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  function handleParseRoutine() {
    setParseResult(parseRoutineImport(importText));
    setSaveMessage('');
    setSaveError('');
  }

  async function handleSaveImportedRoutine(routine: Routine) {
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      await saveRoutine({
        ...routine,
        updatedAt: new Date().toISOString(),
      });
      setSaveMessage(`Saved "${routine.name}" locally.`);
    } catch (error) {
      setSaveError(getReadableError(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Import text</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          onChangeText={setImportText}
          placeholderTextColor={theme.muted}
          selectionColor={theme.accent}
          style={[
            styles.importInput,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          textAlignVertical="top"
          value={importText}
        />
        <Button title="Parse Routine" onPress={handleParseRoutine} style={styles.fullWidth} />
      </View>

      {parseResult.success ? (
        <ImportSuccessPreview
          isSaving={isSaving}
          onSave={handleSaveImportedRoutine}
          result={parseResult}
        />
      ) : (
        <ImportErrorPreview errors={parseResult.errors} />
      )}

      <SaveStatus message={saveMessage} error={saveError} />
    </>
  );
}

function ImportSuccessPreview({
  isSaving,
  onSave,
  result,
}: {
  isSaving: boolean;
  onSave: (routine: Routine) => void;
  result: Extract<ParseRoutineResult, { success: true }>;
}) {
  const { routine } = result;
  const blockCountText = routine.blocks.length === 1 ? '1 block' : `${routine.blocks.length} blocks`;

  return (
    <View style={styles.section}>
      <Card>
        <CardText
          title={routine.name}
          description={routine.description ?? 'No description'}
          meta={blockCountText}
        />
      </Card>
      <BlockPreviewList blocks={routine.blocks} />
      <Button title={isSaving ? 'Saving...' : 'Save Imported Routine'} disabled={isSaving} onPress={() => onSave(routine)} />
    </View>
  );
}

function ImportErrorPreview({ errors }: { errors: ParserError[] }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Card style={[styles.errorCard, { backgroundColor: theme.warningSoft }]}>
        <Text style={[styles.errorTitle, { color: theme.warning }]}>Validation errors</Text>
        {errors.map((error, index) => (
          <View key={`${error.lineNumber}-${index}`} style={styles.errorItem}>
            <Text style={[styles.errorMessage, { color: theme.text }]}>
              {formatErrorLine(error)} {error.message}
            </Text>
            {error.lineText && (
              <Text style={[styles.errorLine, { color: theme.muted }]}>{error.lineText}</Text>
            )}
          </View>
        ))}
      </Card>
    </View>
  );
}

function BlockPreviewList({
  blocks,
  onRemoveBlock,
}: {
  blocks: RoutineBlock[];
  onRemoveBlock?: (blockId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.blockList}>
      {blocks.map((block) => (
        <Card key={block.id}>
          <View style={styles.previewBlockHeader}>
            <Text style={[styles.blockMeta, { color: theme.accent }]}>
              {block.order}. {block.type.toUpperCase()}
            </Text>
            {onRemoveBlock && (
              <Pressable
                accessibilityRole="button"
                onPress={() => onRemoveBlock(block.id)}
                style={({ pressed }) => [
                  styles.removeButton,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.removeButtonText, { color: theme.danger }]}>Remove</Text>
              </Pressable>
            )}
          </View>
          <Text style={[styles.blockTitle, { color: theme.text }]}>{formatExpandedBlockPreview(block)}</Text>
          {block.notes && (
            <Text style={[styles.blockNotes, { color: theme.muted }]}>Notes: {block.notes}</Text>
          )}
        </Card>
      ))}
    </View>
  );
}

function ManualErrors({ errors }: { errors: string[] }) {
  const theme = useTheme();

  return (
    <Card style={[styles.errorCard, { backgroundColor: theme.warningSoft }]}>
      <Text style={[styles.errorTitle, { color: theme.warning }]}>Validation</Text>
      {errors.map((error) => (
        <Text key={error} style={[styles.errorMessage, { color: theme.text }]}>
          {error}
        </Text>
      ))}
    </Card>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        active && { backgroundColor: theme.accentSoft },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.segmentLabel, { color: active ? theme.accent : theme.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function BlockTypeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.blockTypeButton,
        {
          backgroundColor: active ? theme.accentSoft : theme.surface,
          borderColor: active ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.blockTypeLabel, { color: active ? theme.accent : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TextField({
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <TextLabel>{label}</TextLabel>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

function TextLabel({ children }: { children: string }) {
  const theme = useTheme();

  return <Text style={[styles.fieldLabel, { color: theme.text }]}>{children}</Text>;
}

function buildRoutineBlock({
  durationSeconds,
  name,
  notes,
  order,
  reps,
  restBetweenSetsSeconds,
  sets,
  type,
}: {
  durationSeconds: string;
  name: string;
  notes: string;
  order: number;
  reps: string;
  restBetweenSetsSeconds: string;
  sets: string;
  type: RoutineBlockType;
}) {
  const errors: string[] = [];
  const trimmedName = name.trim();
  const trimmedNotes = notes.trim();

  if (type !== 'rest' && !trimmedName) {
    errors.push('Name is required.');
  }

  if (type === 'reps') {
    const parsedReps = parsePositiveInteger(reps, 'Reps', errors);
    const parsedSets = parsePositiveInteger(sets, 'Sets', errors);
    const parsedRestBetweenSets = parseRestBetweenSets(restBetweenSetsSeconds, parsedSets, errors);

    if (
      errors.length > 0 ||
      parsedReps === null ||
      parsedSets === null ||
      parsedRestBetweenSets === null
    ) {
      return { errors };
    }

    return {
      errors,
      blocks: createSetExpandedBlocks({
        type,
        name: trimmedName,
        orderStart: order,
        reps: parsedReps,
        sets: parsedSets,
        restBetweenSetsSeconds: parsedRestBetweenSets,
        notes: trimmedNotes || undefined,
        createId: createDraftBlockId,
      }),
    };
  }

  if (type === 'time') {
    const parsedDuration = parsePositiveInteger(durationSeconds, 'Duration seconds', errors);
    const parsedSets = parsePositiveInteger(sets, 'Sets', errors);
    const parsedRestBetweenSets = parseRestBetweenSets(restBetweenSetsSeconds, parsedSets, errors);

    if (
      errors.length > 0 ||
      parsedDuration === null ||
      parsedSets === null ||
      parsedRestBetweenSets === null
    ) {
      return { errors };
    }

    return {
      errors,
      blocks: createSetExpandedBlocks({
        type,
        name: trimmedName,
        orderStart: order,
        durationSeconds: parsedDuration,
        sets: parsedSets,
        restBetweenSetsSeconds: parsedRestBetweenSets,
        notes: trimmedNotes || undefined,
        createId: createDraftBlockId,
      }),
    };
  }

  if (type === 'rest') {
    const parsedDuration = parsePositiveInteger(durationSeconds, 'Duration seconds', errors);

    if (errors.length > 0 || parsedDuration === null) {
      return { errors };
    }

    return {
      errors,
      blocks: [
        {
          id: createDraftBlockId(),
          type,
          name: trimmedName || 'Rest',
          order,
          durationSeconds: parsedDuration,
          notes: trimmedNotes || undefined,
        } satisfies RoutineBlock,
      ],
    };
  }

  return {
    errors: ['Unsupported block type.'],
  };
}

function parsePositiveInteger(rawValue: string, label: string, errors: string[]) {
  const value = rawValue.trim();

  if (!value) {
    errors.push(`${label} is required.`);
    return null;
  }

  if (!/^\d+$/.test(value)) {
    errors.push(`${label} must be a positive integer.`);
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    errors.push(`${label} must be a positive integer.`);
    return null;
  }

  return parsed;
}

function parseRestBetweenSets(rawValue: string, parsedSets: number | null, errors: string[]) {
  if (!parsedSets || parsedSets <= 1) {
    return undefined;
  }

  return parsePositiveInteger(rawValue, 'Rest between sets', errors);
}

function createDraftBlockId() {
  draftBlockIdCounter += 1;

  return `draft_block_${Date.now().toString(36)}_${draftBlockIdCounter.toString(36)}`;
}

function createRoutineForSave({
  blocks,
  description,
  name,
}: {
  blocks: RoutineBlock[];
  description: string;
  name: string;
}): Routine {
  const now = new Date().toISOString();

  return {
    id: createLocalId('routine'),
    name,
    description: description.trim() || undefined,
    blocks: cloneBlocksForSave(blocks),
    createdAt: now,
    updatedAt: now,
  };
}

function cloneBlocksForSave(blocks: RoutineBlock[]) {
  return blocks.map((block, index) => ({
    ...block,
    id: createLocalId('block'),
    order: index + 1,
  }));
}

function formatExpandedBlockPreview(block: RoutineBlock) {
  switch (block.type) {
    case 'reps':
      return `${block.name} - ${formatSetLabel(block)}${block.reps} reps`;
    case 'time':
      return `${block.name} - ${formatSetLabel(block)}${block.durationSeconds} sec`;
    case 'rest':
      return `${block.name} - ${block.durationSeconds} sec`;
  }
}

function formatSetLabel(block: Extract<RoutineBlock, { type: 'reps' | 'time' }>) {
  if (block.totalSets <= 1) {
    return '';
  }

  return `set ${block.setNumber} of ${block.totalSets} - `;
}

function formatErrorLine(error: ParserError) {
  return error.lineNumber > 0 ? `Line ${error.lineNumber}:` : 'Routine:';
}

function SaveStatus({ error, message }: { error: string; message: string }) {
  const theme = useTheme();

  if (!error && !message) {
    return null;
  }

  return (
    <Card
      style={[
        styles.statusCard,
        { backgroundColor: error ? theme.warningSoft : theme.accentSoft },
      ]}>
      <Text style={[styles.statusText, { color: error ? theme.warning : theme.accent }]}>
        {error || message}
      </Text>
    </Card>
  );
}

function getReadableError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: '800',
  },
  segmentedControl: {
    width: '100%',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  segmentLabel: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '900',
  },
  blockTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  blockTypeButton: {
    minHeight: 44,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  blockTypeLabel: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '900',
  },
  fieldStack: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  multilineInput: {
    minHeight: 84,
  },
  importInput: {
    minHeight: 260,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '600',
    padding: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  blockList: {
    gap: spacing.md,
  },
  previewBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  blockMeta: {
    flex: 1,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '900',
  },
  blockTitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: '800',
  },
  blockNotes: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '700',
  },
  removeButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  removeButtonText: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '900',
  },
  errorCard: {
    borderWidth: 0,
  },
  errorTitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: '900',
  },
  errorItem: {
    gap: spacing.xs,
  },
  errorMessage: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '800',
  },
  errorLine: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '600',
  },
  statusCard: {
    borderWidth: 0,
  },
  statusText: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
