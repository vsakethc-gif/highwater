/**
 * onboarding.tsx — three short screens, shown once (skippable):
 *   1. What the app does   2. Why it asks for location   3. Not an official warning system; call 911.
 * Swipe or tap Next. The 911 button works instantly from the last screen.
 */
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { APP_NAME } from '../../../shared/config';
import { platform } from '../../../shared/platform';
import { Icon, type IconName } from '../components/Icon';
import { Button, Txt } from '../components/ui';
import { font, radius, space, spring, tapTarget, text, useTheme } from '../theme';

export const ONBOARDED_KEY = 'sc5ready.onboarded';

const PAGES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'Waves',
    title: 'Know what’s coming in SC-5',
    body: 'Live river levels, every official weather alert, and plain steps for what to do, for the 8 counties of South Carolina’s 5th District. All from public data, with every rule written out.',
  },
  {
    icon: 'LocateFixed',
    title: 'Your location stays on your phone',
    body: 'If you allow it, we use your location to show hazards and routes near you. It’s sent only to the public weather and flood services that answer for that spot, and it’s never stored.',
  },
  {
    icon: 'Phone',
    title: 'Not an official warning system',
    body: 'This app can be late, wrong, or missing alerts. Always follow local officials and official alerts. In an emergency, call 911.',
  },
];

function finish() {
  platform().storage.setItem(ONBOARDED_KEY, '1');
  router.replace('/');
}

/** The app mark: water rising past a level line, the same as the app icon. */
function Mark({ color }: { color: string }) {
  return (
    <Svg width={72} height={72} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={8} fill={color} />
      <Path d="M16 6v7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M5 19c3.5 0 3.5-2.5 7-2.5s3.5 2.5 7 2.5 3.5-2.5 7-2.5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d="M5 24c3.5 0 3.5-2.5 7-2.5s3.5 2.5 7 2.5 3.5-2.5 7-2.5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.6} />
    </Svg>
  );
}

function Dot({ active }: { active: boolean }) {
  const { c } = useTheme();
  const w = useSharedValue(active ? 24 : 8);
  w.value = withSpring(active ? 24 : 8, spring.snappy);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: active ? c.accent : c.borderStrong }, style]} />;
}

export default function Onboarding() {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const last = page === PAGES.length - 1;

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.top}>
        <Txt style={{ fontFamily: font.serif, fontSize: text.xl }}>{APP_NAME}</Txt>
        {!last ? (
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip introduction" style={s.skip} hitSlop={8}>
            <Txt style={{ color: c.accent, fontFamily: font.semibold }}>Skip</Txt>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {PAGES.map((p, i) => (
          <View key={p.title} style={{ width, paddingHorizontal: space[4], justifyContent: 'center', gap: space[3] }} accessibilityElementsHidden={i !== page}>
            {i === 0 ? (
              <Mark color={c.accent} />
            ) : (
              <View style={[s.iconWrap, { backgroundColor: c.accentTint }]}>
                <Icon name={p.icon} size={34} tint={c.accent} />
              </View>
            )}
            <Txt variant="serifTitle" accessibilityRole="header">
              {p.title}
            </Txt>
            <Txt style={{ fontSize: text.lg, lineHeight: 28, color: c.inkMuted }}>{p.body}</Txt>
            {i === 1 ? (
              <Button
                label="Allow location"
                icon="LocateFixed"
                kind="secondary"
                onPress={() => {
                  Location.requestForegroundPermissionsAsync()
                    .catch(() => {})
                    .finally(() => goTo(2));
                }}
                hint="Optional. You can also choose a county or enter a ZIP code."
              />
            ) : null}
            {i === 2 ? (
              <Pressable onPress={() => Linking.openURL('tel:911')} accessibilityRole="button" accessibilityLabel="Call 911" style={[s.call, { borderColor: c.levels[3].border }]}>
                <Icon name="Phone" tint={c.levels[3].border} />
                <Txt style={{ fontFamily: font.bold, color: c.levels[3].border }}>Call 911</Txt>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <View style={s.bottom}>
        <View style={{ flexDirection: 'row', gap: space[1] }} accessibilityLabel={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((p, i) => (
            <Dot key={p.title} active={i === page} />
          ))}
        </View>
        <Button label={last ? 'Get started' : 'Next'} kind="primary" onPress={() => (last ? finish() : goTo(page + 1))} style={{ minWidth: 140 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space[3], paddingTop: space[1] },
  skip: { minHeight: tapTarget, justifyContent: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space[3], paddingBottom: space[3] },
  call: { flexDirection: 'row', alignItems: 'center', gap: space[1], alignSelf: 'flex-start', minHeight: tapTarget, paddingHorizontal: space[2], borderWidth: 2, borderRadius: radius.md },
});
