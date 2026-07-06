import { StyleSheet, Text, View } from 'react-native';

import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const rows = [
  ['Audio cues', 'Off'],
  ['Theme', 'System'],
  ['Local data', 'Device'],
] as const;

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <Screen title="Settings" subtitle="A compact home for preferences as the app grows.">
      <Card>
        <CardText title="Preferences" description="No account is required to use TEMPO." meta="Local-first" />
      </Card>

      <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {rows.map(([label, value]) => (
          <View key={label} style={[styles.row, { borderColor: theme.border }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
            <Text style={[styles.rowValue, { color: theme.muted }]}>{value}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowLabel: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: '800',
  },
  rowValue: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '700',
  },
});
