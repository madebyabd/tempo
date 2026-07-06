import { StyleSheet, Text, View } from 'react-native';

import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RoutineBuilderScreen() {
  const theme = useTheme();

  return (
    <Screen title="Routine Builder" subtitle="A clean starting point for routine CRUD and plain-text import.">
      <Card>
        <CardText title="Saved routines" description="No routines yet." meta="Library" />
      </Card>

      <Card>
        <CardText
          title="Pipe text import"
          description="The import surface will stay local and paste-friendly."
          meta="Import"
        />
      </Card>

      <View style={[styles.emptyPanel, { backgroundColor: theme.accentSoft }]}>
        <Text style={[styles.emptyValue, { color: theme.accent }]}>0</Text>
        <Text style={[styles.emptyLabel, { color: theme.text }]}>routines ready</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyPanel: {
    borderRadius: 8,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyValue: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: '900',
  },
  emptyLabel: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: '800',
  },
});
