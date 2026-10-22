/**
 * motion.ts — the motion system (MOBILE_BRIEF.md section 5). Every animation uses these values.
 *
 * Why it stays smooth: Reanimated runs animations on the phone's UI thread (the part that draws
 * the screen) instead of the JavaScript thread (the part running our app logic and loading data).
 * So even while river data loads, the status card's color change and the water rising stay at 60 fps.
 *
 * Rules: animate only transform and opacity; entrances play once per meaningful event; no bounce on
 * emergency content; and when the phone's Reduce Motion setting is on, movement becomes a short fade
 * (ReduceMotion.System on every entrance, plus useMotionReduced() for our own effects).
 */
import { Easing, FadeIn, FadeInDown, FadeOut, ReduceMotion, useReducedMotion, type WithSpringConfig } from 'react-native-reanimated';

export const duration = { instant: 0, micro: 120, fast: 200, base: 280, slow: 400, deliberate: 600 } as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasized: Easing.bezier(0.3, 0, 0, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
};

export const spring = {
  /** Press feedback, toggles, chips. */
  snappy: { damping: 18, stiffness: 260, mass: 1 } satisfies WithSpringConfig,
  /** Cards entering, layout changes. */
  gentle: { damping: 20, stiffness: 140, mass: 1 } satisfies WithSpringConfig,
  /** Bottom sheets and drawers. */
  sheet: { damping: 26, stiffness: 220, mass: 1 } satisfies WithSpringConfig,
  /** Markers appearing, the success check. Use rarely. */
  pop: { damping: 12, stiffness: 300, mass: 0.8 } satisfies WithSpringConfig,
};

/** List stagger: 40 ms per item, only the first 8 items are staggered. */
export const STAGGER_MS = 40;
export const STAGGER_MAX = 8;

/** Entrance for the i-th item of a list: fade and rise, a little after the one before (once, on mount). */
export function listItemEntering(i: number) {
  return FadeInDown.duration(duration.base)
    .delay(Math.min(i, STAGGER_MAX) * STAGGER_MS)
    .easing(easing.emphasized)
    .reduceMotion(ReduceMotion.System);
}

export const fadeIn = FadeIn.duration(duration.base).reduceMotion(ReduceMotion.System);
export const fadeOut = FadeOut.duration(duration.fast).reduceMotion(ReduceMotion.System);
/** Emergency content: a fast fade only, never a bounce or a delay. */
export const emergencyFade = FadeIn.duration(duration.fast);

/** True when the phone's "Reduce Motion" setting is on: skip movement, loops, and wave effects. */
export const useMotionReduced = useReducedMotion;
