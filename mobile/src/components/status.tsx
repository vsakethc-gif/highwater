/**
 * status.tsx — the big status card and its parts (same rules and words as the website).
 *
 * If key data is missing or stale and nothing raised the level, the card does NOT say
 * "Normal": it says we can't confirm conditions (no false all-clear).
 *
 * Motion (theme/motion.ts): when the level changes, the card's colors morph to the new level,
 * the headline cross-fades, and the phone gives a short haptic (stronger for more serious levels).
 * At Danger, the icon pulses slowly. Danger itself always appears instantly: motion follows it.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { GuidanceBlock } from '../../../shared/guidance/types';
import { HAZARDS } from '../../../shared/hazards/hazards';
import { LEVELS, type Level } from '../../../shared/hazards/levels';
import type { HazardStatus, OverallStatus, Trigger } from '../../../shared/hazards/types';
import { clockTime, dateTime, relativeTime } from '../../../shared/time';
import { duration, easing, elevation, fadeIn, fadeOut, font, levelHaptic, radius, space, text, useMotionReduced, useTheme } from '../theme';
import { Icon } from './Icon';
import { Txt } from './ui';

export function StatusBadge({ level, large, pulse }: { level: Level; large?: boolean; pulse?: boolean }) {
  const { c } = useTheme();
  const info = LEVELS[level];
  const st = c.levels[level];
  const reduced = useMotionReduced();
  const beat = useSharedValue(1);
  useEffect(() => {
    // The only animation allowed to loop: a slow, subtle pulse on the Danger icon.
    if (pulse && level === 3 && !reduced) {
      beat.value = withRepeat(withSequence(withTiming(1.18, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false);
    } else {
      cancelAnimation(beat);
      beat.value = 1;
    }
  }, [pulse, level, reduced, beat]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));
  return (
    <View
      style={[s.badge, large && s.badgeLarge, { backgroundColor: st.bg, borderColor: st.border }]}
      accessible
      accessibilityLabel={`Level: ${info.name}`}
    >
      <Animated.View style={iconStyle}>
        <Icon name={info.icon} size={large ? 20 : 16} tint={st.fg} />
      </Animated.View>
      <Txt style={{ fontFamily: font.semibold, fontSize: large ? text.lg : text.sm, color: st.fg }}>{info.name}</Txt>
    </View>
  );
}

/** Normal → Watch → Warning → Danger, filled up to the current level. Hidden from screen readers (the badge says it). */
function LevelMeter({ level }: { level: Level }) {
  const { c } = useTheme();
  return (
    <View style={s.meter} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {([0, 1, 2, 3] as Level[]).map((l) => (
        <MeterStep key={l} on={l <= level} current={l === level} index={l} color={c.levels[l].border} track={c.border} label={LEVELS[l].name} />
      ))}
    </View>
  );
}

function MeterStep({ on, current, index, color, track, label }: { on: boolean; current: boolean; index: number; color: string; track: string; label: string }) {
  const { c } = useTheme();
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = on ? withDelay(150 + index * 90, withTiming(1, { duration: duration.base, easing: easing.out })) : withTiming(0, { duration: duration.fast });
  }, [on, index, fill]);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));
  return (
    <View style={{ flex: 1, gap: space[0] }}>
      <View style={[s.meterTrack, { backgroundColor: track }, current && { height: 12 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color, transformOrigin: 'left' }, fillStyle]} />
      </View>
      <Txt style={[s.meterLabel, { color: current ? c.ink : c.inkSubtle }, current && { fontFamily: font.bold }]}>{label}</Txt>
    </View>
  );
}

export interface StatusCardProps {
  overall: OverallStatus;
  top: GuidanceBlock;
  placeName: string;
  updatedAt: string;
  simulated: boolean;
  /** Fresh, complete live data (not simulated, not a saved offline copy). */
  live: boolean;
}

export function StatusCard(p: StatusCardProps) {
  const { c } = useTheme();
  const level = p.overall.level;
  const unconfirmed = !p.overall.complete && level === 0;

  // Morph the card's colors between levels, and announce + haptic when the level changes.
  const progress = useSharedValue<number>(level);
  const previous = useRef<Level | null>(null);
  useEffect(() => {
    progress.value = withTiming(level, { duration: duration.slow, easing: easing.standard });
    if (previous.current !== null && previous.current !== level) {
      levelHaptic(level);
      AccessibilityInfo.announceForAccessibility(`Status changed to ${LEVELS[level].name}. ${p.top.whatsHappening}`);
    }
    previous.current = level;
  }, [level, progress, p.top.whatsHappening]);
  const tints = [c.levels[0].tint, c.levels[1].tint, c.levels[2].tint, c.levels[3].tint];
  const edges = [c.levels[0].border, c.levels[1].border, c.levels[2].border, c.levels[3].border];
  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1, 2, 3], tints),
    borderLeftColor: interpolateColor(progress.value, [0, 1, 2, 3], edges),
  }));

  const updated = `Updated ${relativeTime(p.updatedAt)}, at ${clockTime(p.updatedAt)}`;
  const simTag = p.simulated ? (
    <View style={[s.simTag, { backgroundColor: c.simBg }]}>
      <Icon name="FlaskConical" size={14} tint={c.simFg} />
      <Txt style={{ color: c.simFg, fontFamily: font.semibold, fontSize: text.sm }}>Simulated</Txt>
    </View>
  ) : null;

  if (unconfirmed) {
    return (
      <View style={[s.card, elevation(c, 1), { backgroundColor: c.sunken, borderColor: c.borderStrong, borderLeftColor: c.inkSubtle }]} accessibilityRole="summary">
        <View style={s.top}>
          <View style={[s.badge, s.badgeLarge, { backgroundColor: c.sunken, borderColor: c.inkSubtle, borderStyle: 'dashed' }]}>
            <Icon name="CircleAlert" size={20} />
            <Txt style={{ fontFamily: font.semibold, fontSize: text.lg }}>Can’t confirm</Txt>
          </View>
          {simTag}
        </View>
        <Txt variant="title" accessibilityRole="header" style={{ marginTop: space[2] }}>
          We can’t confirm conditions for {p.placeName} right now
        </Txt>
        {p.overall.gaps.map((g) => (
          <Txt key={g} style={{ marginTop: space[1] }}>
            • {g}
          </Txt>
        ))}
        <Txt style={{ marginTop: space[2] }}>
          Until this is fixed, check{' '}
          <Txt style={[s.link, { color: c.accent }]} onPress={() => Linking.openURL('https://www.weather.gov/alerts')} accessibilityRole="link">
            official alerts on weather.gov
          </Txt>{' '}
          and local news.
        </Txt>
        <Txt variant="meta" style={{ marginTop: space[2] }}>
          {updated}
        </Txt>
      </View>
    );
  }

  const hazard = HAZARDS[p.top.hazard];
  return (
    <Animated.View style={[s.card, elevation(c, 1), { borderColor: level >= 2 ? c.levels[level].border : c.borderStrong }, cardStyle]} accessibilityRole="summary">
      <View style={s.top}>
        <StatusBadge level={level} large pulse />
        <View style={s.hazard}>
          <Icon name={hazard.icon} />
          <Txt variant="label">{hazard.label}</Txt>
        </View>
        {simTag}
      </View>
      {/* The headline cross-fades when it changes (the key makes it a "new" line). */}
      <Animated.View key={p.top.whatsHappening} entering={fadeIn} exiting={fadeOut}>
        <Txt variant="title" accessibilityRole="header" style={{ marginTop: space[2] }}>
          {p.top.whatsHappening}
        </Txt>
      </Animated.View>
      <Txt style={{ marginTop: space[1], color: c.inkMuted }}>{LEVELS[level].meaning}</Txt>
      <LevelMeter level={level} />
      {p.overall.gaps.length ? (
        <View style={[s.note, { backgroundColor: c.sunken }]}>
          <Icon name="Info" />
          <View style={{ flex: 1 }}>
            <Txt>Some data is missing, so this status may be incomplete:</Txt>
            {p.overall.gaps.map((g) => (
              <Txt key={g}>• {g}</Txt>
            ))}
          </View>
        </View>
      ) : null}
      <View style={s.updated}>
        {p.live ? <LiveDot /> : null}
        <Txt variant="meta">
          {p.live ? <Txt variant="meta" style={{ fontFamily: font.bold }}>Live · </Txt> : null}
          {updated}
        </Txt>
      </View>
    </Animated.View>
  );
}

/** A ring grows out of the dot, like a radar ping, for fresh live data only. Plays three times, then rests. */
function LiveDot() {
  const { c } = useTheme();
  const reduced = useMotionReduced();
  const ping = useSharedValue(0);
  useEffect(() => {
    if (!reduced) ping.value = withRepeat(withTiming(1, { duration: 2000, easing: easing.out }), 3, false);
  }, [reduced, ping]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - ping.value), transform: [{ scale: 1 + 1.6 * ping.value }] }));
  return (
    <View style={s.dotWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[s.dot, { position: 'absolute', backgroundColor: c.accent }, ring]} />
      <View style={[s.dot, { backgroundColor: c.accent }]} />
    </View>
  );
}

export function OtherHazards({ active }: { active: HazardStatus[] }) {
  const { c } = useTheme();
  if (active.length < 2) return null;
  return (
    <View style={{ marginTop: space[3], gap: space[1] }}>
      <Txt variant="subheading" accessibilityRole="header">
        Also active here
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[1] }}>
        {active.slice(1).map((h) => (
          <View key={h.hazard} style={[s.chip, { borderColor: c.borderStrong, backgroundColor: c.surface }]}>
            <Icon name={HAZARDS[h.hazard].icon} />
            <Txt variant="label">{HAZARDS[h.hazard].label}</Txt>
            <StatusBadge level={h.level} />
          </View>
        ))}
      </View>
    </View>
  );
}

function TriggerRow({ t }: { t: Trigger }) {
  const { c } = useTheme();
  return (
    <View style={[s.trigger, { borderBottomColor: c.border }]}>
      <StatusBadge level={t.level} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt>{t.text}</Txt>
        <Txt variant="meta">
          {t.url ? (
            <Txt variant="meta" style={[s.link, { color: c.accent }]} onPress={() => Linking.openURL(t.url!)} accessibilityRole="link">
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

/** "Why this status?": every reason behind the status, with its source. Tap to open. */
export function WhyStatus({ overall, checks }: { overall: OverallStatus; checks: string[] }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const turn = useSharedValue(0);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  const triggers = overall.all
    .flatMap((h) => h.triggers)
    .filter((t) => t.level > 0)
    .sort((a, b) => b.level - a.level);
  return (
    <View style={[s.why, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Pressable
        onPress={() => {
          setOpen(!open);
          turn.value = withTiming(open ? 0 : 1, { duration: duration.base, easing: easing.standard });
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={s.whyHead}
      >
        <Animated.View style={chevron}>
          <Icon name="ChevronDown" />
        </Animated.View>
        <Txt variant="label" style={{ fontSize: text.md }}>
          Why this status?
        </Txt>
      </Pressable>
      {open ? (
        <Animated.View entering={fadeIn} style={{ paddingHorizontal: space[2], paddingBottom: space[2], gap: space[1] }}>
          {triggers.length ? triggers.map((t, i) => <TriggerRow key={i} t={t} />) : <Txt>Nothing we check is above Normal right now.</Txt>}
          <Txt variant="label" style={{ marginTop: space[1] }}>
            What we checked
          </Txt>
          {checks.map((ch) => (
            <Txt key={ch} style={[s.check, { borderLeftColor: c.borderStrong }]}>
              {ch}
            </Txt>
          ))}
          <Txt variant="meta">These are fixed, published rules (see More → How it works). This is transparent, rule-based analysis of official data, not an official warning.</Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: space[0], paddingHorizontal: space[1], minHeight: 30, borderWidth: 1, borderRadius: radius.sm, alignSelf: 'flex-start' },
  badgeLarge: { minHeight: 40, paddingHorizontal: space[2] },
  card: { marginTop: space[2], padding: space[3], borderWidth: 1, borderLeftWidth: 10, borderRadius: radius.lg },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space[1] },
  hazard: { flexDirection: 'row', alignItems: 'center', gap: space[0] },
  simTag: { flexDirection: 'row', alignItems: 'center', gap: space[0], paddingHorizontal: space[1], paddingVertical: 2, borderRadius: radius.sm },
  meter: { flexDirection: 'row', gap: space[0], marginTop: space[3], alignItems: 'flex-end' },
  meterTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  meterLabel: { fontSize: text.xs, lineHeight: 16 },
  note: { flexDirection: 'row', gap: space[1], marginTop: space[2], padding: space[2], borderRadius: radius.sm },
  updated: { flexDirection: 'row', alignItems: 'center', gap: space[1], marginTop: space[2] },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space[1], padding: space[0], paddingLeft: space[1], borderWidth: 1, borderRadius: radius.md },
  why: { marginTop: space[2], borderWidth: 1, borderRadius: radius.md },
  whyHead: { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: 48, paddingHorizontal: space[2] },
  trigger: { flexDirection: 'row', gap: space[2], paddingVertical: space[1], borderBottomWidth: 1 },
  check: { paddingLeft: space[2], borderLeftWidth: 2 },
  link: { textDecorationLine: 'underline' },
});
