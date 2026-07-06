import type { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = PropsWithChildren<
  Omit<PressableProps, 'children' | 'style'> & {
    style?: StyleProp<ViewStyle>;
  }
>;

export function Card({ children, disabled, style, ...pressableProps }: CardProps) {
  const theme = useTheme();
  const isPressable = Boolean(pressableProps.onPress) && !disabled;

  return (
    <Pressable
      accessibilityRole={isPressable ? 'button' : undefined}
      disabled={disabled || !pressableProps.onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        isPressable && pressed && styles.pressed,
        style,
      ]}
      {...pressableProps}>
      {children}
    </Pressable>
  );
}

type CardTextProps = {
  title: string;
  description?: string;
  meta?: string;
};

export function CardText({ title, description, meta }: CardTextProps) {
  const theme = useTheme();

  return (
    <>
      {meta && <Text style={[styles.meta, { color: theme.accent }]}>{meta}</Text>}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  meta: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: '800',
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: '500',
  },
});
