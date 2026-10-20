/**
 * More tab — Scenario Mode (demo emergencies, including the real Helene replays), and the app's
 * rules, limits, privacy, and credits. The full "How it works" page opens on the website.
 */
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { APP_NAME } from '../../../../shared/config';
import { platform } from '../../../../shared/platform';
import { SCENARIOS } from '../../../../shared/scenario/scenario';
import { Icon } from '../../components/Icon';
import { Screen, Section, Txt } from '../../components/ui';
import { useAppState } from '../../state';
import { font, listItemEntering, radius, space, tapHaptic, useTheme } from '../../theme';
import { ONBOARDED_KEY } from '../onboarding';

const SITE = 'https://vsakethc-gif.github.io/highwater/';

const LIMITS = [
  'It is not an official warning system. It can be late, wrong, or missing alerts. Official alerts, local officials, and 911 come first.',
  'River gauge readings are provisional, some gauges go offline, and many small creeks have no gauge at all.',
  'FEMA flood zones show long-term risk, not where it is flooding today, and some maps are years old.',
  'Census figures are estimates with margins of error, especially for small neighborhoods.',
  'Routes can’t see every closed or flooded road, and the free routing service can be busy or unavailable.',
  'Shelter information is only as current as the FEMA and Red Cross data. Always confirm with your county.',
  'Community reports are unverified, can be wrong, and are not sent to any government agency.',
];

function Row({ title, detail, onPress, selected }: { title: string; detail?: string; onPress: () => void; selected?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [s.row, { borderColor: selected ? c.accent : c.border, backgroundColor: pressed ? c.sunken : selected ? c.accentTint : c.surface }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="label" style={{ fontSize: 16 }}>
          {title}
        </Txt>
        {detail ? <Txt variant="meta">{detail}</Txt> : null}
      </View>
      {selected ? <Icon name="Check" tint={c.accent} /> : <Icon name="ArrowRight" tint={c.inkSubtle} />}
    </Pressable>
  );
}

export default function MoreScreen() {
  const { c } = useTheme();
  const { scenario, setScenario } = useAppState();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space[2], paddingBottom: 120 }}>
        <View style={{ paddingTop: space[3] }}>
          <Txt variant="serifTitle" accessibilityRole="header">
            More
          </Txt>
        </View>

        <Section title="Scenario Mode">
          <Txt style={{ marginBottom: space[2], color: c.inkMuted }}>
            Replay an emergency to see how the app responds. The two Helene replays use real archived alerts and river readings; the others are made up. Everything is labeled SIMULATION, and nothing is saved or sent.
          </Txt>
          <View style={{ gap: space[1] }}>
            {SCENARIOS.map((sc, i) => (
              <Animated.View key={sc.id} entering={listItemEntering(i)}>
                <Row
                  title={sc.title}
                  detail={sc.summary}
                  selected={scenario === sc.id}
                  onPress={() => {
                    tapHaptic();
                    setScenario(sc.id, sc.county);
                    router.navigate('/');
                  }}
                />
              </Animated.View>
            ))}
            {scenario ? <Row title="Turn off Scenario Mode" detail="Back to live data" onPress={() => setScenario(null)} /> : null}
          </View>
        </Section>

        <Section title="How it works">
          <Txt>
            {APP_NAME} turns official public data into a status using fixed, written rules: an alert table, river gauges compared with official flood stages, and a rain forecast rule. There’s no AI in the app. Every rule, threshold, and source is listed on the How it works page.
          </Txt>
          <Pressable onPress={() => Linking.openURL(`${SITE}#/methodology`)} accessibilityRole="link" style={s.link}>
            <Txt style={{ color: c.accent, textDecorationLine: 'underline', fontFamily: font.semibold }}>Open How it works</Txt>
            <Icon name="ExternalLink" size={14} tint={c.accent} />
          </Pressable>
        </Section>

        <Section title="What it can’t do">
          {LIMITS.map((l) => (
            <View key={l} style={s.bullet}>
              <View style={[s.dot, { backgroundColor: c.inkMuted }]} />
              <Txt style={{ flex: 1 }}>{l}</Txt>
            </View>
          ))}
        </Section>

        <Section title="Privacy">
          <Txt>
            No accounts, no ads, no tracking. If you use your location, it stays on your phone and is sent only to the public services that answer for that spot. It is never stored. Only your chosen county is remembered on this phone.
          </Txt>
        </Section>

        <Section title="About">
          <Txt>
            Built by a high school student in York County for the 2026 Congressional App Challenge. Parts of the code were written with help from an AI coding assistant; see the AI disclosure in the code repository. Data: USGS, NOAA, National Weather Service, FEMA, U.S. Census Bureau, Iowa Environmental Mesonet.
          </Txt>
          <Pressable
            onPress={() => {
              platform().storage.setItem(ONBOARDED_KEY, '0');
              router.replace('/onboarding');
            }}
            accessibilityRole="button"
            style={s.link}
          >
            <Txt style={{ color: c.accent, textDecorationLine: 'underline', fontFamily: font.semibold }}>Show the introduction again</Txt>
          </Pressable>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2], padding: space[2], borderWidth: 1, borderRadius: radius.md, minHeight: 56 },
  link: { flexDirection: 'row', alignItems: 'center', gap: space[0], minHeight: 44, marginTop: space[1] },
  bullet: { flexDirection: 'row', gap: space[1], alignItems: 'flex-start', marginBottom: space[1] },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
});
