import { useColorScheme } from 'react-native';

import { colors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme();

  return colors[scheme === 'dark' ? 'dark' : 'light'];
}
