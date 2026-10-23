/**
 * TabBar.tsx — the bottom tab bar (brief section 6, item 21): five tabs, each with an icon AND a label.
 * The selected tab's icon grows to 108% and fills in, its label turns blue, and a short indicator
 * slides to it with a snappy spring. On iPhone the bar uses the system blur like Apple's own apps,
 * unless "Reduce Transparency" is on; on Android it's a solid surface.
 */
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, haptic, space, spring, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui/Text';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Status', icon: 'Activity' },
  map: { label: 'Map', icon: 'Map' },
  route: { label: 'Route', icon: 'Signpost' },
  report: { label: 'Report', icon: 'Megaphone' },
  more: { label: 'More', icon: 'Menu' },
};

/** Height of the bar's content, above the home-indicator area. Screens leave this much room. */
export const TAB_BAR_HEIGHT = 58;

function TabButton({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const grow = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    grow.value = withSpring(focused ? 1 : 0, spring.snappy);
  }, [focused, grow]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.08 * grow.value }] }));
  const tab = TABS[name];
  if (!tab) return null;
  const tint = focused ? c.accent : c.inkMuted;
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={tab.label} style={s.tab}>
      <Animated.View style={iconStyle}>
        <Icon name={tab.icon} size={23} tint={tint} filled={focused} />
      </Animated.View>
      <Txt variant="footnote" color={tint} style={{ fontSize: 11, lineHeight: 14, fontFamily: focused ? font.bold : font.medium }}>
        {tab.label}
      </Txt>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [solid, setSolid] = useState(Platform.OS !== 'ios');
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setSolid).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setSolid);
    return () => sub.remove();
  }, []);
  // Tabs switched off in features.ts (href: null) are left out of the bar.
  const visible = state.routes.filter((r) => (descriptors[r.key]?.options as { href?: unknown } | undefined)?.href !== null);
  const tabWidth = width / Math.max(1, visible.length);
  const visibleIndex = Math.max(0, visible.findIndex((r) => r.key === state.routes[state.index]?.key));
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(visibleIndex * tabWidth, spring.snappy);
  }, [visibleIndex, tabWidth, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const content = (
    <View style={{ flexDirection: 'row', height: TAB_BAR_HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {width > 0 ? (
        <Animated.View style={[s.indicator, { width: tabWidth }, indicator]}>
          <View style={[s.indicatorBar, { backgroundColor: c.accent }]} />
        </Animated.View>
      ) : null}
      {visible.map((route) => (
        <TabButton
          key={route.key}
          name={route.name}
          focused={state.routes[state.index]?.key === route.key}
          onPress={() => {
            if (state.routes[state.index]?.key !== route.key) {
              haptic.select();
              navigateToTab(route.key);
            }
          }}
        />
      ))}
    </View>
  );

  const frame = [s.bar, { paddingBottom: Math.max(insets.bottom, space.s), borderTopColor: c.hairline }];
  if (!solid) {
    return (
      <BlurView intensity={85} tint={isDark ? 'dark' : 'light'} style={frame}>
        {content}
      </BlurView>
    );
  }
  return <View style={[frame, { backgroundColor: c.surface }]}>{content}</View>;
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: space.xs },
  indicator: { position: 'absolute', top: 0, height: 3, alignItems: 'center' },
  indicatorBar: { width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
