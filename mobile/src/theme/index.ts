/**
 * theme/index.ts — useTheme() gives every component the right palette for the chosen appearance
 * (System, Light, or Dark, set in More → Settings). In Scenario Mode the accent turns slate.
 */
import { useColorScheme } from 'react-native';
import { useAppState } from '../state';
import { dark, light, simulationAccent, type Palette } from './tokens';

export * from './tokens';
export * from './motion';
export { haptic } from './haptics';

export function useTheme(): { c: Palette; isDark: boolean } {
  const system = useColorScheme();
  const { scenario, appearance } = useAppState();
  const isDark = appearance === 'system' ? system === 'dark' : appearance === 'dark';
  const base = isDark ? dark : light;
  const c = scenario ? { ...base, ...simulationAccent[isDark ? 'dark' : 'light'] } : base;
  return { c, isDark };
}
