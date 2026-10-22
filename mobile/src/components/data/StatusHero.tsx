/**
 * StatusHero.tsx — the hero status card and "Why this status?" (brief section 8.2, items 2–3).
 *
 * The card shows the level as a big serif word, the badge, the top hazard, and a headline built from
 * the actual triggers. Along its bottom edge runs the water line; its height reflects the level
 * (low at Normal, high at Danger), tinted with that level's soft color.
 *
 * Motion when the level changes: the level word cross-fades, the badge's colors morph, the water
 * rises or falls with a gentle settle, the phone gives the matching haptic, and screen readers hear
 * the new status. At Danger the badge icon breathes slowly. Danger always appears instantly.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { GuidanceBlock } from '../../../../shared/guidance/types';
import { HAZARDS } from '../../../../shared/hazards/hazards';
import { LEVELS, type Level } from '../../../../shared/hazards/levels';
import type { OverallStatus, Trigger } from '../../../../shared/hazards/types';
import { dateTime } from '../../../../shared/time';
import { duration, easing, elevation, haptic, radius, space, useMotionReduced, useTheme } from '../../theme';
import { Icon } from '../Icon';
import { Pressable } from '../ui/Button';
import { StatusBadge } from '../ui/Chips';
import { Txt } from '../ui/Text';
import { WaterLine } from '../ui/WaterLine';

/**
 * The level's icon in a soft circle of the level color. The big serif word right below names the
 * level, so the hero doesn't repeat it. At Danger the icon breathes slowly (unless Reduce Motion).
 */
function LevelIcon({ level }: { level: Level }) {
  const { c } = useTheme();
  const reduced = useMotionReduced();
  const beat = useSharedValue(1);
  useEffect(() => {
    if (level === 3 && !reduced) beat.value = withRepeat(withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })), -1, false);
    else {
      cancelAnimation(beat);
      beat.value = 1;
    }
  }, [level, reduced, beat]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));
  return (
    <Animated.View style={[s.levelIcon, { backgroundColor: c.levels[level].bg }, style]}>
      <Icon name={LEVELS[level].icon} size={22} tint={c.levels[level].fg} />
    </Animated.View>
  );
}

/** How high the water sits in the card's bottom band, by level. */
const WATER: Record<Level, number> = { 0: 0.3, 1: 0.48, 2: 0.66, 3: 0.86 };

export function StatusHero({ overall, top, placeName, onPress }: { overall: OverallStatus; top: GuidanceBlock; placeName: string; onPress: () => void }) {
  const { c, isDark } = useTheme();
  const level = overall.level;
  const unconfirmed = !overall.complete && level === 0;
  const previous = useRef<Level | null>(null);

  useEffect(() => {
    if (previous.current !== null && previous.current !== level) {
      haptic.level(level);
      AccessibilityInfo.announceForAccessibility(`Status changed to ${LEVELS[level].name}. ${top.whatsHappening}`);
    }
    previous.current = level;
  }, [level, top.whatsHappening]);

  const hazard = HAZARDS[top.hazard];
  const word = unconfirmed ? 'Can’t confirm' : LEVELS[level].name;
  // Danger appears instantly; other changes cross-fade.
  const enter = level === 3 ? undefined : FadeIn.duration(duration.slow).reduceMotion(ReduceMotion.System);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${word}. ${unconfirmed ? `We can’t confirm conditions for ${placeName} right now.` : top.whatsHappening}`} accessibilityHint="Shows why" scaleTo={0.985}>
      <View style={[s.card, { backgroundColor: c.surface }, elevation(c, isDark, 1), unconfirmed && { borderWidth: 1, borderStyle: 'dashed', borderColor: c.inkFaint }]}>
        {/* The water line along the bottom edge: higher for more serious levels. */}
        <WaterLine fill={unconfirmed ? 0.2 : WATER[level]} top={unconfirmed ? c.surfaceSunken : c.levels[level].bg} bottom={unconfirmed ? c.surfaceSunken : c.levels[level].bg} amplitude={7} periodMs={5200} style={s.water} />
        <View style={s.topRow}>
          {unconfirmed ? (
            <View style={[s.unknownBadge, { borderColor: c.inkFaint }]}>
              <Icon name="CircleAlert" size={18} />
            </View>
          ) : (
            <LevelIcon level={level} />
          )}
          <View style={s.hazard}>
            <Icon name={hazard.icon} size={18} tint={c.inkMuted} />
            <Txt variant="callout" tone="muted">
              {hazard.label}
            </Txt>
          </View>
        </View>
        <Animated.View key={word} entering={enter} exiting={FadeOut.duration(duration.fast)}>
          <Txt variant="display" color={unconfirmed ? c.ink : c.levels[level].fg} style={{ marginTop: space.m }} accessibilityRole="header">
            {word}
          </Txt>
        </Animated.View>
        <Animated.View key={top.whatsHappening} entering={enter}>
          <Txt variant="title3" style={{ marginTop: space.xs }}>
            {unconfirmed ? `We can’t confirm conditions for ${placeName} right now.` : top.whatsHappening}
          </Txt>
        </Animated.View>
        {unconfirmed || level > 0 ? (
          <Txt variant="callout" tone="muted" style={{ marginTop: space.s }}>
            {unconfirmed ? 'Some official data didn’t load. Check weather.gov and local news.' : LEVELS[level].meaning}
          </Txt>
        ) : null}
        <View style={{ height: 64 }} />
      </View>
    </Pressable>
  );
}

function TriggerRow({ t, last }: { t: Trigger; last: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[s.trigger, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline }]}>
      <StatusBadge level={t.level} size="s" />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="callout">{t.text}</Txt>
        <Txt variant="footnote">
          {t.url ? (
            <Txt variant="footnote" tone="accent" onPress={() => Linking.openURL(t.url!)} accessibilityRole="link">
              {t.source}
            </Txt>
          ) : (
            t.source
          )}
          {t.time ? ` · ${dateTime(t.time)}` : ''}
        </Txt>
      </View>
    </View>
  );
}

/** "Why this status?": opens smoothly to show every trigger with its source, and what we checked. */
export function WhyStatus({ overall, checks, open, onToggle }: { overall: OverallStatus; checks: string[]; open: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: duration.base, easing: easing.standard });
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  const triggers = overall.all.flatMap((h) => h.triggers).filter((t) => t.level > 0).sort((a, b) => b.level - a.level);
  return (
    <View style={[s.why, { backgroundColor: c.surface, borderColor: c.hairline }]}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel="Why this status?" scaleTo={0.99}>
        <View style={s.whyHead}>
          <Txt variant="headline" style={{ flex: 1 }}>
            Why this status?
          </Txt>
          <Animated.View style={chevron}>
            <Icon name="ChevronDown" size={20} tint={c.inkMuted} />
          </Animated.View>
        </View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(duration.base).reduceMotion(ReduceMotion.System)} style={{ paddingHorizontal: space.l, paddingBottom: space.l }}>
          {triggers.length ? triggers.map((t, i) => <TriggerRow key={i} t={t} last={i === triggers.length - 1} />) : <Txt variant="callout">Nothing we check is above Normal right now.</Txt>}
          <Txt variant="caption" tone="muted" style={{ marginTop: space.l, marginBottom: space.s }}>
            What we checked
          </Txt>
          {checks.map((ch) => (
            <View key={ch} style={[s.check, { borderLeftColor: c.hairline }]}>
              <Txt variant="callout" tone="muted">
                {ch}
              </Txt>
            </View>
          ))}
          <Txt variant="footnote" style={{ marginTop: space.m }}>
            Fixed, published rules (More → How it works). Transparent, rule-based analysis of official data, not an official warning.
          </Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, overflow: 'hidden' },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 72 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, flexWrap: 'wrap' },
  levelIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  unknownBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  hazard: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  why: { borderWidth: 1, borderRadius: radius.md, marginTop: space.m },
  whyHead: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: space.l },
  trigger: { flexDirection: 'row', gap: space.m, paddingVertical: space.m, alignItems: 'flex-start' },
  check: { borderLeftWidth: 2, paddingLeft: space.m, marginBottom: space.s },
});
