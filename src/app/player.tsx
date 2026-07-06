import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutPlayerScreen() {
  const theme = useTheme();

  return (
    <Screen title="Workout Player" subtitle="The player shell is ready for the timestamp-diff timer layer.">
      <View style={[styles.timerPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.timerLabel, { color: theme.muted }]}>Ready</Text>
        <Text style={[styles.timerText, { color: theme.text }]}>00:00</Text>
        <Text style={[styles.timerSubtext, { color: theme.muted }]}>No active routine</Text>
      </View>

      <View style={styles.controls}>
        <Button title="Start" disabled />
        <Button title="Skip" variant="secondary" disabled />
      </View>

      <Card>
        <CardText title="Current step" description="Timer state comes in Layer 5." meta="Queue" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timerPanel: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  timerLabel: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timerText: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '900',
  },
  timerSubtext: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
