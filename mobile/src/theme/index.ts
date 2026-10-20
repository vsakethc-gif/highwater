/**
 * theme/index.ts — useTheme() gives every screen the right palette for light or dark mode.
 * In Scenario Mode the accent shifts to a muted slate, so it's always obvious you're in a simulation.
 */
import { useColorScheme } from 'react-native';
import { useAppState } from '../state';
import { dark, light, type Palette } from './tokens';

export * from './tokens';
export * from './motion';

export function useTheme(): { c: Palette; isDark: boolean } {
  const isDark = useColorScheme() === 'dark';
  const { scenario } = useAppState();
  const base = isDark ? dark : light;
  const c = scenario ? { ...base, accent: isDark ? '#9fb3bf' : '#3d5866', accentTint: isDark ? '#22303a' : '#e6ebee' } : base;
  return { c, isDark };
}
