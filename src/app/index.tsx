import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import {
  deleteRoutine,
  getAllRoutines,
  getRoutineById,
  initializeDatabase,
} from '@/db/routineRepository';
import type { Routine, RoutineBlock, RoutineSummary } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedRoutineId = selectedRoutine?.id;

  const loadRoutines = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      await initializeDatabase();
      const nextRoutines = await getAllRoutines();
      setRoutines(nextRoutines);

      if (selectedRoutineId) {
        const freshRoutine = await getRoutineById(selectedRoutineId);
        setSelectedRoutine(freshRoutine);
      }
    } catch (loadError) {
      setError(getReadableError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoutineId]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutines();
    }, [loadRoutines])
  );

  async function handleSelectRoutine(id: string) {
    setError('');
    setMessage('');

    try {
      const routine = await getRoutineById(id);

      if (!routine) {
        setSelectedRoutine(null);
        setError('Routine was not found.');
        await loadRoutines();
        return;
      }

      setSelectedRoutine(routine);
    } catch (selectError) {
      setError(getReadableError(selectError));
    }
  }

  function handleConfirmDelete(routine: Routine) {
    Alert.alert('Delete routine?', `Delete "${routine.name}" from this device?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDeleteRoutine(routine);
        },
      },
    ]);
  }

  async function handleDeleteRoutine(routine: Routine) {
    setError('');
    setMessage('');

    try {
      await deleteRoutine(routine.id);
      setSelectedRoutine(null);
      setMessage(`Deleted "${routine.name}".`);
      await loadRoutines();
    } catch (deleteError) {
      setError(getReadableError(deleteError));
    }
  }

  const destinations = [
    {
      title: 'Routine Builder',
      description: 'Create or import routines and save them locally.',
      meta: 'Plan',
      href: '/builder',
    },
    {
      title: 'Workout Player',
      description: 'A focused player shell for the future timer state machine.',
      meta: 'Train',
      href: '/player',
    },
    {
      title: 'History',
      description: 'A quiet place for completed sessions and streaks later.',
      meta: 'Review',
      href: '/history',
    },
    {
      title: 'Settings',
      description: 'Local app preferences will live here.',
      meta: 'Tune',
      href: '/settings',
    },
  ] as const;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.kicker, { color: theme.accent }]}>Android-first workout timer</Text>
        <Text style={[styles.brand, { color: theme.text }]}>TEMPO</Text>
        <Text style={[styles.tagline, { color: theme.muted }]}>No-bullshit workout timing.</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Build Routine" onPress={() => router.push('/builder' as Href)} />
        <Button
          title="Refresh"
          variant="secondary"
          disabled={isLoading}
          onPress={() => {
            void loadRoutines();
          }}
        />
      </View>

      <StatusMessage message={message} error={error} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved routines</Text>
          <Text style={[styles.sectionMeta, { color: theme.muted }]}>
            {isLoading ? 'Loading' : `${routines.length} saved`}
          </Text>
        </View>

        {routines.length === 0 ? (
          <Card>
            <CardText
              title="No routines saved yet"
              description="Build a routine, save it, and it will appear here."
              meta="Local"
            />
          </Card>
        ) : (
          routines.map((routine) => (
            <Card
              key={routine.id}
              accessibilityLabel={`Open ${routine.name}`}
              onPress={() => {
                void handleSelectRoutine(routine.id);
              }}>
              <CardText
                title={routine.name}
                description={routine.description ?? 'No description'}
                meta={`${routine.blockCount} ${routine.blockCount === 1 ? 'block' : 'blocks'}`}
              />
            </Card>
          ))
        )}
      </View>

      {selectedRoutine && (
        <RoutineDetails routine={selectedRoutine} onDelete={() => handleConfirmDelete(selectedRoutine)} />
      )}

      <View style={styles.destinationList}>
        {destinations.map((destination) => (
          <Card
            key={destination.href}
            onPress={() => router.push(destination.href as Href)}
            accessibilityLabel={`Open ${destination.title}`}>
            <CardText
              title={destination.title}
              description={destination.description}
              meta={destination.meta}
            />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function RoutineDetails({ routine, onDelete }: { routine: Routine; onDelete: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Card>
        <CardText
          title={routine.name}
          description={routine.description ?? 'No description'}
          meta={`${routine.blocks.length} ${routine.blocks.length === 1 ? 'block' : 'blocks'}`}
        />
      </Card>

      <View style={styles.timeline}>
        {routine.blocks.map((block) => (
          <Card key={block.id}>
            <Text style={[styles.blockMeta, { color: theme.accent }]}>
              {block.order}. {block.type.toUpperCase()}
            </Text>
            <Text style={[styles.blockTitle, { color: theme.text }]}>{formatBlockPreview(block)}</Text>
            {block.notes && (
              <Text style={[styles.blockNotes, { color: theme.muted }]}>Notes: {block.notes}</Text>
            )}
          </Card>
        ))}
      </View>

      <View style={styles.detailsActions}>
        <Button title="Start Workout - coming next" disabled style={styles.detailsButton} />
        <DeleteButton onPress={onDelete} />
      </View>
    </View>
  );
}

function DeleteButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.deleteButton,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Delete Routine</Text>
    </Pressable>
  );
}

function StatusMessage({ error, message }: { error: string; message: string }) {
  const theme = useTheme();

  if (!error && !message) {
    return null;
  }

  return (
    <Card style={[styles.statusCard, { backgroundColor: error ? theme.warningSoft : theme.accentSoft }]}>
      <Text style={[styles.statusText, { color: error ? theme.warning : theme.accent }]}>
        {error || message}
      </Text>
    </Card>
  );
}

function formatBlockPreview(block: RoutineBlock) {
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

function getReadableError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  kicker: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  brand: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: '900',
  },
  tagline: {
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    width: '100%',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: '900',
  },
  sectionMeta: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '800',
  },
  timeline: {
    gap: spacing.md,
  },
  blockMeta: {
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
  detailsActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailsButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  deleteButtonText: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: '900',
  },
  statusCard: {
    borderWidth: 0,
  },
  statusText: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '800',
  },
  destinationList: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
