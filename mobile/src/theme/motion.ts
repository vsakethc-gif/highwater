/**
 * motion.ts — the app's motion system: every animation uses these values, never one-off numbers.
 *
 * How it stays smooth: Reanimated runs animations on the phone's UI thread (the part that draws
 * the screen), not the JavaScript thread (the part that runs our app logic). So even when the app
 * is busy loading data, animations keep running at 60 frames per second.
 *
 * Rules: animate only position/scale (transform) and see-through-ness (opacity); short and calm;
 * nothing loops forever except the slow Danger pulse; and when the phone's "Reduce Motion"
 * setting is on, movement becomes a simple fade (see useMotion()).
 */
import * as Haptics from 'expo-haptics';
import { Easing, FadeIn, FadeInDown, FadeOut, ReduceMotion, useReducedMotion, type WithSpringConfig } from 'react-native-reanimated';
import type { Level } from '../../../shared/hazards/levels';

export const duration = { fast: 150, base: 250, slow: 400 } as const;

export const easing = {
  /** Standard: quick start, gentle stop. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Entrances: things arrive fast and settle. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
};

export const spring = {
  /** Sheets, cards settling into place. */
  gentle: { damping: 18, stiffness: 140, mass: 1 } satisfies WithSpringConfig,
  /** Presses, tab indicator, small pops. */
  snappy: { damping: 20, stiffness: 320, mass: 0.8 } satisfies WithSpringConfig,
};

/** Delay between items in a list as they arrive (only on first appearance). */
export const STAGGER_MS = 40;

/** Entrance for the i-th item of a list: fade and rise, a little after the one before. */
export function listItemEntering(i: number) {
  return FadeInDown.duration(duration.base)
    .delay(Math.min(i, 8) * STAGGER_MS)
    .easing(easing.out)
    .reduceMotion(ReduceMotion.System);
}

export const fadeIn = FadeIn.duration(duration.base).reduceMotion(ReduceMotion.System);
export const fadeOut = FadeOut.duration(duration.fast).reduceMotion(ReduceMotion.System);

/** Light tick for primary actions. */
export function tapHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** A short haptic when the status level changes: stronger for more serious levels. */
export function levelHaptic(level: Level): void {
  if (level === 0) return;
  const style = level === 1 ? Haptics.ImpactFeedbackStyle.Light : level === 2 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy;
  Haptics.impactAsync(style).catch(() => {});
}

/** True when the phone's "Reduce Motion" setting is on: components then skip movement and loops. */
export const useMotionReduced = useReducedMotion;
