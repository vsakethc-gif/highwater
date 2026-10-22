/**
 * tokens.ts — the phone app's design tokens (MOBILE_BRIEF.md section 4). Screens use ONLY these.
 *
 * Every text/background pair was checked with scripts/contrast.mjs (WCAG): body text ≥ 4.5:1,
 * large text and icons ≥ 3:1, in both themes. One change from the brief: light inkFaint was
 * #68737D (4.07:1 on surfaceSunken), darkened to #5F6A74 (≥ 4.65:1 everywhere).
 */
import type { TextStyle } from 'react-native';
import type { Level } from '../../../shared/hazards/levels';

export interface LevelColors {
  /** Text and icon color for the level (also its strong edge). */
  fg: string;
  /** Soft background for badges, tiles, the hero card's water line. */
  bg: string;
}

export interface Palette {
  bg: string;
  surface: string;
  surfaceSunken: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  hairline: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** The water-line motif: top and bottom of its subtle fill. */
  waterTop: string;
  waterBottom: string;
  /** The Scenario Mode banner: unmistakable, inverted from the page. */
  simBg: string;
  simFg: string;
  shadow: string;
  levels: Record<Level, LevelColors>;
}

export const light: Palette = {
  bg: '#F7F5F0', // warm off-white
  surface: '#FFFFFF',
  surfaceSunken: '#EFEBE3',
  ink: '#0F1A24',
  inkMuted: '#47535E',
  inkFaint: '#5F6A74',
  hairline: '#E2DDD3',
  accent: '#0B4F7A', // deep water blue
  accentSoft: '#DCE9F2',
  onAccent: '#FFFFFF',
  waterTop: '#2A7AB0',
  waterBottom: '#7FB6D9',
  simBg: '#0F1A24',
  simFg: '#FFFFFF',
  shadow: '#0F1A24',
  levels: {
    0: { fg: '#2B6A5E', bg: '#E3F0EC' }, // Normal
    1: { fg: '#8A5A00', bg: '#FBEFD3' }, // Watch
    2: { fg: '#A8420F', bg: '#FBE3D5' }, // Warning
    3: { fg: '#9A1B30', bg: '#F8DADF' }, // Danger
  },
};

export const dark: Palette = {
  bg: '#0B1117',
  surface: '#121A22',
  surfaceSunken: '#18222C',
  ink: '#E9EEF2',
  inkMuted: '#A9B5C0',
  inkFaint: '#8794A0',
  hairline: '#22303B',
  accent: '#6BB6E8',
  accentSoft: '#16324A',
  onAccent: '#0B1117',
  waterTop: '#2C6E9C',
  waterBottom: '#1B4767',
  simBg: '#E9EEF2',
  simFg: '#0B1117',
  shadow: '#000000',
  levels: {
    0: { fg: '#7CCBB8', bg: '#12302A' },
    1: { fg: '#F2C46B', bg: '#3A2C0C' },
    2: { fg: '#FF9F6E', bg: '#3E1D0E' },
    3: { fg: '#FF8A9B', bg: '#42121B' },
  },
};

/** In Scenario Mode the accent shifts to a muted slate, so a simulation never looks like live data. */
export const simulationAccent = { light: { accent: '#3D5866', accentSoft: '#E3E9EC' }, dark: { accent: '#A4B8C4', accentSoft: '#22303A' } };

/** Spacing scale (points). Screen side padding 20, section gap 32, card padding 16–20. */
export const space = { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, x3: 32, x4: 40, x5: 48, x6: 64 } as const;
export const SCREEN_PAD = space.xl;

export const radius = { sm: 8, md: 14, lg: 20, sheet: 28, pill: 999 } as const;

/** Minimum touch target. */
export const tapTarget = 44;

/** Font families, as loaded in app/_layout.tsx. */
export const font = {
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semibold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  serif: 'Newsreader_600SemiBold',
  serifMedium: 'Newsreader_500Medium',
};

/** The type scale (brief 4.5). Numbers use tabular figures so changing values don't jitter. */
export const type = {
  display: { fontFamily: font.serif, fontSize: 40, lineHeight: 44, letterSpacing: -0.6 },
  title1: { fontFamily: font.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
  title2: { fontFamily: font.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  title3: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  headline: { fontFamily: font.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  callout: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  footnote: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4, textTransform: 'uppercase' },
  numberXL: { fontFamily: font.semibold, fontSize: 48, lineHeight: 52, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  numberL: { fontFamily: font.semibold, fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  serifTitle: { fontFamily: font.serif, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
} satisfies Record<string, TextStyle>;

export type TypeStyle = keyof typeof type;

/** Depth (brief 4.6): soft shadows in light mode; in dark mode, no shadows, a hairline instead. */
export function elevation(p: Palette, isDark: boolean, level: 1 | 2) {
  if (isDark) return { borderWidth: 1, borderColor: p.hairline };
  return level === 1
    ? { shadowColor: p.shadow, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
    : { shadowColor: p.shadow, shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 };
}
