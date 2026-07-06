import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardText } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const destinations = [
    {
      title: 'Routine Builder',
      description: 'Shape workouts before storage and import arrive.',
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
          title="Open Player"
          variant="secondary"
          onPress={() => router.push('/player' as Href)}
        />
      </View>

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
  destinationList: {
    gap: spacing.md,
  },
});
