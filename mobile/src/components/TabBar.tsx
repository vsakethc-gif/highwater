/**
 * TabBar.tsx — the bottom tab bar: five tabs, each with an icon AND a text label.
 * The selected tab's icon grows slightly, and a short indicator slides to it (a spring).
 * On iPhone the bar uses the system blur, like Apple's own apps; on Android it's a solid surface.
 */
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, space, spring, tapHaptic, text, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Status', icon: 'Activity' },
  map: { label: 'Map', icon: 'Map' },
  route: { label: 'Route', icon: 'Signpost' },
  report: { label: 'Report', icon: 'Megaphone' },
  more: { label: 'More', icon: 'Menu' },
};

function TabButton({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const grow = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    grow.value = withSpring(focused ? 1 : 0, spring.snappy);
  }, [focused, grow]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.12 * grow.value }, { translateY: -1.5 * grow.value }] }));
  const tab = TABS[name];
  if (!tab) return null;
  const tint = focused ? c.accent : c.inkMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={tab.label}
      style={s.tab}
    >
      <Animated.View style={iconStyle}>
        <Icon name={tab.icon} size={22} tint={tint} />
      </Animated.View>
      <Txt style={{ fontSize: text.xs, fontFamily: focused ? font.bold : font.medium, color: tint }}>{tab.label}</Txt>
    </Pressable>
  );
}

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const tabWidth = width / state.routes.length;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(state.index * tabWidth, spring.snappy);
  }, [state.index, tabWidth, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const content = (
    <View style={{ flexDirection: 'row' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {width > 0 ? (
        <Animated.View style={[s.indicator, { width: tabWidth }, indicator]}>
          <View style={[s.indicatorBar, { backgroundColor: c.accent }]} />
        </Animated.View>
      ) : null}
      {state.routes.map((route, i) => (
        <TabButton
          key={route.key}
          name={route.name}
          focused={state.index === i}
          onPress={() => {
            if (state.index !== i) {
              tapHaptic();
              navigateToTab(route.key);
            }
          }}
        />
      ))}
    </View>
  );

  const frame = [s.bar, { paddingBottom: Math.max(insets.bottom, space[1]), borderTopColor: c.border }];
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={frame}>
        {content}
      </BlurView>
    );
  }
  return <View style={[frame, { backgroundColor: c.surface }]}>{content}</View>;
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56, paddingTop: space[1] },
  indicator: { position: 'absolute', top: 0, height: 3, alignItems: 'center' },
  indicatorBar: { width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
