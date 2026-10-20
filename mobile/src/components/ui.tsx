/**
 * ui.tsx — small building blocks used on every screen: text styles, sections, notices,
 * buttons, loading placeholders, and the screen frame with the Scenario Mode banner.
 * Everything follows light/dark mode (useTheme) and the motion system (theme/motion.ts).
 */
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type TextProps, type ViewStyle } from 'react-native';
import Animated, { SlideInUp, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { findScenario } from '../../../shared/scenario/scenario';
import { useAppState } from '../state';
import { duration, easing, font, radius, space, spring, tapHaptic, tapTarget, text, useMotionReduced, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

// ---------- Text ----------
type Variant = 'body' | 'meta' | 'label' | 'title' | 'heading' | 'subheading' | 'serifTitle' | 'eyebrow';

const variants = StyleSheet.create({
  body: { fontFamily: font.regular, fontSize: text.md, lineHeight: 24 },
  meta: { fontFamily: font.regular, fontSize: text.sm, lineHeight: 20 },
  label: { fontFamily: font.semibold, fontSize: text.sm, lineHeight: 20 },
  title: { fontFamily: font.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: font.semibold, fontSize: text.xl, lineHeight: 30, letterSpacing: -0.2 },
  subheading: { fontFamily: font.semibold, fontSize: text.lg, lineHeight: 24 },
  serifTitle: { fontFamily: font.serif, fontSize: text.xxl, lineHeight: 38, letterSpacing: -0.4 },
  eyebrow: { fontFamily: font.semibold, fontSize: text.sm, letterSpacing: 0.8, textTransform: 'uppercase' },
});

export function Txt({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const { c } = useTheme();
  const tone = variant === 'meta' ? c.inkSubtle : variant === 'eyebrow' ? c.inkMuted : c.ink;
  // allowFontScaling (on by default) follows the phone's text-size setting; layouts wrap instead of clipping.
  return <Text {...rest} style={[variants[variant], { color: tone }, style]} />;
}

// ---------- Section: opens with a short heavy rule, like a newspaper data page (and the website) ----------
export function Section({ title, children, style }: { title: string; children: ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View style={[{ paddingTop: space[5] }, style]}>
      <View style={{ height: 3, backgroundColor: c.ink, marginBottom: space[1] }} />
      <Txt variant="heading" accessibilityRole="header" style={{ marginBottom: space[2] }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

// ---------- Notices ----------
export function Notice({ icon = 'Info', title, children, tone = 'info' }: { icon?: IconName; title?: string; children?: ReactNode; tone?: 'info' | 'error' | 'empty' }) {
  const { c } = useTheme();
  const edge = tone === 'error' ? c.levels[2].border : tone === 'empty' ? c.levels[0].border : c.accent;
  return (
    <View
      style={{ flexDirection: 'row', gap: space[1], padding: space[2], borderWidth: 1, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: edge, borderRadius: radius.md, backgroundColor: c.surface }}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
    >
      <Icon name={icon} tint={tone === 'empty' ? c.levels[0].fg : c.ink} />
      <View style={{ flex: 1, gap: space[0] }}>
        {title ? <Txt variant="label">{title}</Txt> : null}
        {typeof children === 'string' ? <Txt>{children}</Txt> : children}
      </View>
    </View>
  );
}

// ---------- Buttons: press in slightly, spring back, light haptic on primary actions ----------
export function Button({
  label,
  icon,
  onPress,
  kind = 'secondary',
  disabled,
  hint,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  kind?: 'primary' | 'secondary';
  disabled?: boolean;
  hint?: string;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const primary = kind === 'primary';
  return (
    <Animated.View style={[pressStyle, style]}>
      <Pressable
        onPress={() => {
          if (primary) tapHaptic();
          onPress();
        }}
        onPressIn={() => (scale.value = withSpring(0.97, spring.snappy))}
        onPressOut={() => (scale.value = withSpring(1, spring.snappy))}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled }}
        style={[
          s.button,
          primary ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong },
          disabled && { opacity: 0.5 },
        ]}
      >
        {icon ? <Icon name={icon} tint={primary ? c.onAccent : c.ink} /> : null}
        <Text style={[s.buttonText, { color: primary ? c.onAccent : c.ink }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------- Loading placeholder: a soft highlight sweeps across, shaped like the real content ----------
export function Skeleton({ height, style }: { height: number; style?: ViewStyle }) {
  const { c, isDark } = useTheme();
  const reduced = useMotionReduced();
  const x = useSharedValue(-1);
  useEffect(() => {
    if (!reduced) x.value = withRepeat(withTiming(1, { duration: 1300, easing: easing.standard }), -1, false);
  }, [reduced, x]);
  const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 360 }] }));
  return (
    <View
      style={[{ height, borderRadius: radius.md, backgroundColor: c.sunken, overflow: 'hidden', marginTop: space[2] }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, { width: 140, backgroundColor: isDark ? '#ffffff0d' : '#ffffff99' }, sweep]} />
    </View>
  );
}

// ---------- Screen frame: safe areas, status bar, and the Scenario Mode banner on every screen ----------
export function Screen({ children }: { children: ReactNode }) {
  const { c, isDark } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SimulationBanner />
      {children}
    </SafeAreaView>
  );
}

function SimulationBanner() {
  const { c } = useTheme();
  const { scenario, setScenario } = useAppState();
  const info = findScenario(scenario);
  if (!info) return null;
  return (
    <Animated.View
      entering={SlideInUp.duration(duration.base)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[1], paddingHorizontal: space[2], paddingVertical: space[1], backgroundColor: c.simBg }}
      accessibilityRole="summary"
      accessibilityLabel={`Simulation, not live data. ${info.title}`}
    >
      <Icon name="FlaskConical" tint={c.simFg} />
      <View style={{ flex: 1 }}>
        <Text style={[s.simStrong, { color: c.simFg }]}>SIMULATION — not live data</Text>
        <Text style={[s.simText, { color: c.simFg }]} numberOfLines={2}>
          {info.title}
        </Text>
      </View>
      <Pressable
        onPress={() => setScenario(null)}
        accessibilityRole="button"
        accessibilityLabel="Turn off Scenario Mode"
        style={{ minHeight: tapTarget, justifyContent: 'center', paddingHorizontal: space[1], borderWidth: 1, borderColor: c.simFg, borderRadius: radius.sm }}
        hitSlop={8}
      >
        <Text style={[s.simOffText, { color: c.simFg }]}>Turn off</Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  button: { minHeight: tapTarget, paddingHorizontal: space[2], borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[1] },
  buttonText: { fontFamily: font.semibold, fontSize: text.md },
  simStrong: { fontFamily: font.bold, fontSize: text.sm, letterSpacing: 0.3 },
  simText: { fontFamily: font.regular, fontSize: text.sm },
  simOffText: { fontFamily: font.semibold, fontSize: text.sm },
});
