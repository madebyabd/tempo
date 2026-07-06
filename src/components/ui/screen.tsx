import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  trailing?: ReactNode;
}>;

export function Screen({ children, eyebrow, title, subtitle, trailing }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          {(eyebrow || title || subtitle || trailing) && (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {eyebrow && <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>}
                {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
                {subtitle && <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>}
              </View>
              {trailing}
            </View>
          )}

          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: '500',
  },
});
