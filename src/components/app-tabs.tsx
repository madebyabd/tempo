import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { colors, typography } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const theme = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={theme.surface}
      iconColor={{ default: theme.muted, selected: theme.accent }}
      indicatorColor={theme.accentSoft}
      labelStyle={{
        default: {
          color: theme.muted,
          fontSize: typography.size.xs,
          fontWeight: '700',
        },
        selected: {
          color: theme.text,
          fontSize: typography.size.xs,
          fontWeight: '800',
        },
      }}
      labelVisibilityMode="labeled"
      rippleColor={theme.accentSoft}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="builder">
        <NativeTabs.Trigger.Label>Builder</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="edit_note" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="player">
        <NativeTabs.Trigger.Label>Player</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="timer" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="history" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
