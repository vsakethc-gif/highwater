/**
 * tokens.ts — the phone app's design tokens. Light mode uses the same values as the website's
 * src/styles/tokens.css; dark mode is designed from the same roles (paper, ink, accent, status),
 * with every text color checked for WCAG AA contrast on its background.
 * Screens use only these values, never raw colors or sizes.
 */
import type { Level } from '../../../shared/hazards/levels';

export interface Palette {
  bg: string;
  surface: string;
  sunken: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentTint: string;
  onAccent: string;
  simBg: string;
  simFg: string;
  shadow: string;
  levels: Record<Level, LevelColors>;
}

export interface LevelColors {
  /** Badge fill and its text color. */
  bg: string;
  fg: string;
  /** Strong edge color (the card's side band, the level meter). */
  border: string;
  /** Light wash for the big status card. */
  tint: string;
}

export const light: Palette = {
  bg: '#faf8f4', // warm off-white "paper"
  surface: '#ffffff',
  sunken: '#f2efe9',
  ink: '#14202b', // near-black with a blue cast
  inkMuted: '#505c67',
  inkSubtle: '#606b75',
  border: '#d6dadf',
  borderStrong: '#a9b1b9',
  accent: '#0b4f7c', // deep water blue
  accentTint: '#e5eef5',
  onAccent: '#ffffff',
  simBg: '#14202b',
  simFg: '#ffffff',
  shadow: '#14202b',
  // Each level also has its own icon and word, so color is never the only signal.
  levels: {
    0: { bg: '#eaf3ee', fg: '#1f5c43', border: '#5f9179', tint: '#f1f7f3' },
    1: { bg: '#fdf1cf', fg: '#6e4c00', border: '#a8831a', tint: '#fdf4d9' },
    2: { bg: '#b54708', fg: '#ffffff', border: '#b54708', tint: '#fcefe6' },
    3: { bg: '#7a0e2a', fg: '#ffffff', border: '#7a0e2a', tint: '#faebef' },
  },
};

export const dark: Palette = {
  bg: '#0f161d', // deep blue-black, not pure black
  surface: '#17212b',
  sunken: '#1d2833',
  ink: '#e8edf2',
  inkMuted: '#a9b4bf',
  inkSubtle: '#97a3ae',
  border: '#2a3642',
  borderStrong: '#465461',
  accent: '#6cb4e4', // the same water blue, lightened to read on dark
  accentTint: '#163247',
  onAccent: '#08131c',
  simBg: '#e8edf2', // inverted, so Scenario Mode stays unmistakable
  simFg: '#0f161d',
  shadow: '#000000',
  levels: {
    0: { bg: '#163a2a', fg: '#9ad9b8', border: '#4f9a76', tint: '#122019' },
    1: { bg: '#3d300a', fg: '#f3d57e', border: '#c19a2c', tint: '#211b0b' },
    2: { bg: '#c2570f', fg: '#ffffff', border: '#e07a36', tint: '#2a170c' },
    3: { bg: '#a3193c', fg: '#ffffff', border: '#e0557a', tint: '#2a0f17' },
  },
};

/** 8-point spacing grid (with a 4-point half step). */
export const space = { 0: 4, 1: 8, 2: 16, 3: 24, 4: 32, 5: 48, 6: 64 } as const;

/** Type scale: 12 / 14 / 16 / 18 / 24 / 32 / 44. */
export const text = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32, xxxl: 44 } as const;

export const radius = { sm: 6, md: 10, lg: 16 } as const;

/** Minimum touch target (44 points). */
export const tapTarget = 44;

/** Font family names, as loaded in app/_layout.tsx. */
export const font = {
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semibold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  serif: 'SourceSerif4_600SemiBold',
};

/** Soft depth for cards and sheets (restrained: one level for cards, one for floating things). */
export function elevation(p: Palette, level: 1 | 2) {
  return level === 1
    ? { shadowColor: p.shadow, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }
    : { shadowColor: p.shadow, shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 };
}
