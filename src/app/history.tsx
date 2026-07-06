import { StyleSheet, Text, View } from 'react-native';

import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const stats = [
  { label: 'Sessions', value: '0' },
  { label: 'Minutes', value: '0' },
  { label: 'Streak', value: '0' },
] as const;

export default function HistoryScreen() {
  const theme = useTheme();

  return (
    <Screen title="History" subtitle="Completed workouts and streaks will stay local-first.">
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Card>
        <CardText title="No workouts logged yet" description="Session history starts after the player is wired." meta="Log" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
