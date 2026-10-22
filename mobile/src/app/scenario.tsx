/**
 * scenario.tsx — the Scenario Mode picker, as a native sheet (brief section 8.9).
 * The two Helene replays use real archived alerts and river readings; the others are made up.
 * Every scenario is labeled SIMULATION, and nothing is ever saved or sent.
 */
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { isReplay, SCENARIOS } from '../../../shared/scenario/scenario';
import { Icon } from '../components/Icon';
import { Button, Pressable } from '../components/ui/Button';
import { Txt } from '../components/ui/Text';
import { useAppState } from '../state';
import { haptic, listItemEntering, radius, SCREEN_PAD, space, useTheme } from '../theme';

export default function ScenarioPicker() {
  const { c } = useTheme();
  const { scenario, setScenario } = useAppState();
  return (
    <ScrollView style={{ backgroundColor: c.surface }} contentContainerStyle={{ padding: SCREEN_PAD, paddingTop: space.xxl, gap: space.m, paddingBottom: space.x5 }}>
      <Txt variant="title2" accessibilityRole="header">
        Scenario Mode
      </Txt>
      <Txt variant="callout" tone="muted">
        Replay an emergency to see how the app responds. Everything is labeled SIMULATION, and nothing is saved or sent.
      </Txt>
      {SCENARIOS.map((sc, i) => {
        const selected = scenario === sc.id;
        const real = isReplay(sc.id);
        return (
          <Animated.View key={sc.id} entering={listItemEntering(i)}>
            <Pressable
              onPress={() => {
                haptic.select();
                setScenario(sc.id, sc.county);
                router.back();
                router.navigate('/');
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${sc.title}. ${sc.summary}`}
              scaleTo={0.985}
            >
              <View style={[s.card, { borderColor: selected ? c.accent : c.hairline, backgroundColor: selected ? c.accentSoft : c.bg }]}>
                <View style={{ flexDirection: 'row', gap: space.s, alignItems: 'center', flexWrap: 'wrap' }}>
                  <View style={[s.tag, { backgroundColor: c.simBg }]}>
                    <Icon name="FlaskConical" size={12} tint={c.simFg} />
                    <Txt variant="caption" color={c.simFg}>
                      Simulation
                    </Txt>
                  </View>
                  {real ? (
                    <View style={[s.tag, { backgroundColor: c.accentSoft }]}>
                      <Txt variant="caption" tone="accent">
                        Real data
                      </Txt>
                    </View>
                  ) : null}
                  {selected ? <Icon name="Check" size={18} tint={c.accent} /> : null}
                </View>
                <Txt variant="headline">{sc.title}</Txt>
                <Txt variant="callout" tone="muted">
                  {sc.summary}
                </Txt>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
      {scenario ? (
        <Button
          label="Exit Scenario Mode"
          onPress={() => {
            setScenario(null);
            router.back();
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { padding: space.l, borderWidth: 1, borderRadius: radius.md, gap: space.xs },
  tag: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.s, paddingVertical: 2, borderRadius: radius.pill },
});
