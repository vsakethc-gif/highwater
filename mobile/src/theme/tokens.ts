/**
 * tokens.ts — the phone app's design tokens (MOBILE_BRIEF.md section 4). Screens use ONLY these.
 *
 * Every text/background pair was checked with scripts/contrast.mjs (WCAG): body text ≥ 4.5:1,
 * large text and icons ≥ 3:1, in both themes. One change from the brief: light inkFaint was
 * #68737D (4.07:1 on surfaceSunken), darkened to #5F6A74 (≥ 4.65:1 everywhere).
 * Oct 23 polish: stronger, more saturated status colors (still AA), plus a solid "band" color per
 * level for the Status screen's full-width top, with the text color that reads on it ("onBand").
 */
import type { TextStyle } from 'react-native';
import type { Level } from '../../../shared/hazards/levels';

export interface LevelColors {
  /** Text and icon color for the level (also its strong edge). */
  fg: string;
  /** Soft background for badges, tiles, the hero card's water line. */
  bg: string;
  /** Solid, saturated fill for the Status screen's top band. */
  band: string;
  /** Text and icon color on the band (white, or ink on the light amber). */
  onBand: string;
}

export interface Palette {
  bg: string;
  surface: string;
  surfaceSunken: string;
  /** A step above surface: grouped rows, pressed cells, sheets on dark. */
  surfaceRaised: string;
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
  surfaceRaised: '#FFFFFF',
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
    0: { fg: '#17694F', bg: '#D6F0E4', band: '#14775A', onBand: '#FFFFFF' }, // Normal
    1: { fg: '#7F5100', bg: '#FCE7B0', band: '#F2B41E', onBand: '#0F1A24' }, // Watch
    2: { fg: '#AE3A00', bg: '#FDD8C2', band: '#C4490A', onBand: '#FFFFFF' }, // Warning
    3: { fg: '#A30D2A', bg: '#F9D0D8', band: '#B5102F', onBand: '#FFFFFF' }, // Danger
  },
};

export const dark: Palette = {
  // REDESIGN.md 2.2 dark surfaces. inkFaint is #7F8B97, a hair lighter than the brief's #7C8894
  // (which measured 4.50:1 on surfaceRaised, right at the line); now ≥ 4.7:1 everywhere.
  bg: '#0A0F14',
  surface: '#121921',
  surfaceSunken: '#18212B',
  surfaceRaised: '#18212B',
  ink: '#EEF2F5',
  inkMuted: '#A3AFBA',
  inkFaint: '#7F8B97',
  hairline: 'rgba(255,255,255,0.08)',
  accent: '#6BB6E8',
  accentSoft: '#16324A',
  onAccent: '#0A0F14',
  waterTop: '#2C6E9C',
  waterBottom: '#1B4767',
  simBg: '#E9EEF2',
  simFg: '#0B1117',
  shadow: '#000000',
  levels: {
    0: { fg: '#6FD3B4', bg: '#0F3328', band: '#1B7A5F', onBand: '#FFFFFF' },
    1: { fg: '#F5C55A', bg: '#3D2D08', band: '#E0A41A', onBand: '#0B1117' },
    2: { fg: '#FF9A63', bg: '#44200C', band: '#C9500F', onBand: '#FFFFFF' },
    3: { fg: '#FF8296', bg: '#4A1220', band: '#B0182F', onBand: '#FFFFFF' },
  },
};

/** In Scenario Mode the accent shifts to a muted slate, so a simulation never looks like live data. */
export const simulationAccent = { light: { accent: '#3D5866', accentSoft: '#E3E9EC' }, dark: { accent: '#A4B8C4', accentSoft: '#22303A' } };

/** Spacing scale (points). Screen side padding 20, section gap 32, card padding 16–20. */
export const space = { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, x3: 32, x4: 40, x5: 48, x6: 64 } as const;
export const SCREEN_PAD = space.xl;

export const radius = { sm: 8, md: 14, module: 18, lg: 20, sheet: 28, pill: 999 } as const;

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
  /** The Status scene's giant level word ("Warning"). Capped on small phones in the hero. */
  sceneWord: { fontFamily: font.serif, fontSize: 64, lineHeight: 68, letterSpacing: -1.2 },
  /** Small uppercase label on each Status module ("WHY THIS STATUS"), Weather style. */
  moduleLabel: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypeStyle = keyof typeof type;

/** Depth (brief 4.6): soft shadows in light mode; in dark mode, no shadows, a hairline instead. */
export function elevation(p: Palette, isDark: boolean, level: 1 | 2) {
  if (isDark) return { borderWidth: 1, borderColor: p.hairline };
  return level === 1
    ? { shadowColor: p.shadow, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
    : { shadowColor: p.shadow, shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 };
}

/* ------------------------------------------------------------------------------------------------
 * The Status "living scene" (REDESIGN.md section 2.1). Each level has its own atmosphere: a vertical
 * gradient, an accent for highlights, and a tint for the water line. These gradients are the ONLY
 * gradients allowed in the app. "unknown" is a neutral slate for "we can't confirm conditions", so
 * missing data never looks like a calm, all-clear night.
 * ---------------------------------------------------------------------------------------------- */
export type SceneKey = Level | 'unknown';

export interface ScenePalette {
  top: string;
  bottom: string;
  accent: string;
  /** The water line's front wave and the deeper back wave. */
  water: string;
  waterBack: string;
}

export const scene: Record<SceneKey, ScenePalette> = {
  0: { top: '#0F2C42', bottom: '#061520', accent: '#8FD3C7', water: 'rgba(46,108,147,0.55)', waterBack: 'rgba(46,108,147,0.30)' },
  1: { top: '#4A3512', bottom: '#130D05', accent: '#F2C46B', water: 'rgba(156,116,40,0.50)', waterBack: 'rgba(156,116,40,0.28)' },
  2: { top: '#5C220E', bottom: '#160805', accent: '#FF9F6E', water: 'rgba(180,80,30,0.50)', waterBack: 'rgba(180,80,30,0.28)' },
  3: { top: '#5E1020', bottom: '#15040A', accent: '#FF8A9B', water: 'rgba(176,42,67,0.50)', waterBack: 'rgba(176,42,67,0.28)' },
  unknown: { top: '#2A3138', bottom: '#0B0E11', accent: '#C9D2DA', water: 'rgba(120,134,148,0.40)', waterBack: 'rgba(120,134,148,0.22)' },
};

/**
 * Text and surfaces on the scene. Checked in scripts/contrast.mjs against the lightest part of each
 * gradient AND against a module on it. The brief's 55% white for meta text measured 4.10:1 inside a
 * module on Watch, so meta and labels use 62% white (≥ 4.7:1 everywhere).
 */
export const sceneInk = {
  primary: '#FFFFFF',
  secondary: 'rgba(255,255,255,0.72)',
  meta: 'rgba(255,255,255,0.62)',
  module: 'rgba(255,255,255,0.07)',
  moduleBorder: 'rgba(255,255,255,0.10)',
  /** Backing for floating chrome (ribbon, timeline) when there's no blur. */
  floating: 'rgba(8,12,16,0.95)',
  /** Live dot (green-teal), out-of-date / offline dot (amber), simulation (violet). */
  live: '#8FD3C7',
  amber: '#F2C46B',
  sim: '#C7B8FF',
  /** Darkens the scene as you scroll, so modules stay readable. */
  shade: '#000000',
  /** The soft red glow breathing at the top of the screen at Danger. */
  glow: 'rgba(255,77,106,0.55)',
} as const;

/** How high the water line sits, as a share of screen height from the bottom (REDESIGN.md 4). */
export const SCENE_WATER: Record<Level, number> = { 0: 0.18, 1: 0.26, 2: 0.34, 3: 0.42 };

/** The palette components see while drawn on the scene: dark, with white ink and the level's accent. */
export function scenePalette(key: SceneKey): Palette {
  return {
    ...dark,
    bg: scene[key].bottom,
    surface: sceneInk.module,
    surfaceSunken: 'rgba(255,255,255,0.08)',
    surfaceRaised: 'rgba(255,255,255,0.12)',
    ink: sceneInk.primary,
    inkMuted: sceneInk.secondary,
    inkFaint: sceneInk.meta,
    hairline: sceneInk.moduleBorder,
    accent: scene[key].accent,
    accentSoft: 'rgba(255,255,255,0.12)',
    onAccent: '#0A0F14',
  };
}

/** Solid icon-tile colors for grouped lists (iOS Settings style). White icons on each are ≥ 4.5:1. */
export const tiles = {
  violet: '#6550C2',
  blue: '#2A6896',
  teal: '#1B7A5F',
  amber: '#9A6510',
  red: '#B0182F',
  slate: '#4A5663',
} as const;
