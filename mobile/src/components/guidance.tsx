/**
 * guidance.tsx — "What to do": plain-language steps for the top hazard (same rules and words as
 * the website, from shared/guidance). The "Do this now" steps are a checklist you can tick off;
 * your progress is remembered on this phone. Every block ends with the official disclaimer.
 */
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { DISCLAIMER } from '../../../shared/config';
import type { GuidanceBlock } from '../../../shared/guidance/types';
import { platform } from '../../../shared/platform';
import { duration, font, listItemEntering, radius, space, spring, tapHaptic, text, useTheme } from '../theme';
import { Icon } from './Icon';
import { Section, Txt } from './ui';

const key = (g: GuidanceBlock, i: number) => `sc5ready.check.${g.hazard}.${g.level}.${i}`;

function CheckStep({ g, i, step }: { g: GuidanceBlock; i: number; step: string }) {
  const { c } = useTheme();
  const [done, setDone] = useState(() => platform().storage.getItem(key(g, i)) === '1');
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const toggle = () => {
    const next = !done;
    setDone(next);
    platform().storage.setItem(key(g, i), next ? '1' : '0');
    if (next) {
      tapHaptic();
      pop.value = withSequence(withTiming(1.25, { duration: duration.fast }), withSpring(1, spring.snappy));
    }
  };
  return (
    <Animated.View entering={listItemEntering(i)}>
      <Pressable
        onPress={toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={step}
        style={({ pressed }) => [s.step, { borderColor: c.border, backgroundColor: pressed ? c.sunken : c.surface }]}
      >
        <Animated.View style={[s.box, { borderColor: done ? c.accent : c.borderStrong, backgroundColor: done ? c.accent : 'transparent' }, popStyle]}>
          {done ? <Icon name="Check" size={16} tint={c.onAccent} /> : <Txt style={{ fontFamily: font.bold, color: c.accent, fontSize: text.sm }}>{i + 1}</Txt>}
        </Animated.View>
        <Txt style={[{ flex: 1 }, done && { color: c.inkMuted }]}>{step}</Txt>
      </Pressable>
    </Animated.View>
  );
}

export function GuidanceView({ g }: { g: GuidanceBlock }) {
  const { c } = useTheme();
  return (
    <Section title="What to do">
      {g.shelterInPlace && g.level >= 1 ? (
        <View style={[s.shelter, { backgroundColor: c.accentTint, borderColor: c.accent }]}>
          <Icon name="House" size={22} tint={c.accent} />
          <Txt style={{ flex: 1 }}>
            <Txt style={{ fontFamily: font.bold }}>Stay where you are and take shelter. </Txt>
            For this kind of danger, trying to drive away puts you at more risk. That’s why this app doesn’t offer a route out.
          </Txt>
        </View>
      ) : null}

      <Txt variant="subheading" accessibilityRole="header" style={s.sub}>
        Do this now
      </Txt>
      <View style={{ gap: space[1] }}>
        {g.doNow.map((step, i) => (
          <CheckStep key={step} g={g} i={i} step={step} />
        ))}
      </View>

      <Txt variant="subheading" accessibilityRole="header" style={s.sub}>
        If it gets worse
      </Txt>
      {g.ifWorse.map((line) => (
        <View key={line} style={s.bullet}>
          <View style={[s.dot, { backgroundColor: c.inkMuted }]} />
          <Txt style={{ flex: 1 }}>{line}</Txt>
        </View>
      ))}

      <Txt variant="subheading" accessibilityRole="header" style={s.sub}>
        Check on others
      </Txt>
      <Txt>{g.checkOnOthers}</Txt>

      <Txt variant="subheading" accessibilityRole="header" style={s.sub}>
        Official guidance
      </Txt>
      {g.links.map((l) => (
        <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} accessibilityRole="link" style={s.linkRow}>
          <Txt style={{ color: c.accent, textDecorationLine: 'underline', fontFamily: font.medium }}>{l.label}</Txt>
          <Icon name="ExternalLink" size={14} tint={c.accent} />
        </Pressable>
      ))}

      <View style={[s.disclaimer, { borderTopColor: c.border }]}>
        <Icon name="Phone" />
        <Txt style={{ flex: 1, fontFamily: font.semibold }}>{DISCLAIMER}</Txt>
      </View>
    </Section>
  );
}

const s = StyleSheet.create({
  sub: { marginTop: space[3], marginBottom: space[1] },
  step: { flexDirection: 'row', alignItems: 'center', gap: space[2], padding: space[2], borderWidth: 1, borderRadius: radius.md, minHeight: 56 },
  box: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bullet: { flexDirection: 'row', gap: space[1], alignItems: 'flex-start', marginBottom: space[1] },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  shelter: { flexDirection: 'row', gap: space[1], padding: space[2], borderWidth: 1, borderRadius: radius.md, marginBottom: space[1] },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space[0], minHeight: 44 },
  disclaimer: { flexDirection: 'row', gap: space[1], marginTop: space[3], paddingTop: space[2], borderTopWidth: 1 },
});
