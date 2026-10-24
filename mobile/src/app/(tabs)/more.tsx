/**
 * More tab (brief section 8.8): Demo & simulation, Learn, Settings, About.
 * Long-press the version number to open the hidden Design Gallery (for checking the look).
 */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { APP_NAME } from '../../../../shared/config';
import { Wordmark } from '../../components/Logo';
import { findScenario } from '../../../../shared/scenario/scenario';
import { SegmentedControl } from '../../components/ui/Chips';
import { Card, ListRow, SectionHeader } from '../../components/ui/Layout';
import { LargeTitleScroll, Screen } from '../../components/ui/Screen';
import { Txt } from '../../components/ui/Text';
import { useAppState, type Appearance } from '../../state';
import { haptic, space, useTheme } from '../../theme';
import { ONBOARDED_KEY } from '../onboarding';
import { platform } from '../../../../shared/platform';

const SITE = 'https://vsakethc-gif.github.io/highwater/';

export const LIMITS = [
  'It is not an official warning system. It can be late, wrong, or missing alerts. Official alerts, local officials, and 911 come first.',
  'River gauge readings are provisional, some gauges go offline, and many small creeks have no gauge at all.',
  'FEMA flood zones show long-term risk, not where it is flooding today, and some maps are years old.',
  'Census figures are estimates with margins of error, especially for small neighborhoods.',
  'Routes can’t see every closed or flooded road, and the free routing service can be busy or unavailable.',
  'Shelter information is only as current as the FEMA and Red Cross data. Always confirm with your county.',
  'Community reports are unverified, can be wrong, and are not sent to any government agency.',
];

export default function MoreScreen() {
  const { c } = useTheme();
  const { scenario, setScenario, appearance, setAppearance, haptics, setHaptics } = useAppState();
  const active = findScenario(scenario);
  return (
    <Screen>
      <LargeTitleScroll title="More">
        <View style={s.section}>
          <SectionHeader title="Demo & simulation" />
          <Card style={{ paddingVertical: 0 }}>
            <ListRow icon="FlaskConical" title="Scenario Mode" subtitle={active ? `On: ${active.title}` : 'Replay Hurricane Helene or a made-up emergency'} onPress={() => router.push('/scenario')} last={!active} />
            {active ? <ListRow icon="X" title="Exit Scenario Mode" subtitle="Back to live data" onPress={() => setScenario(null)} chevron={false} last /> : null}
          </Card>
        </View>

        <View style={s.section}>
          <SectionHeader title="Learn" />
          <Card style={{ paddingVertical: 0 }}>
            <ListRow icon="BookOpen" title="How it works" subtitle="Every rule, threshold, and source" onPress={() => Linking.openURL(`${SITE}#/methodology`)} />
            <ListRow icon="Database" title="Data sources and credits" subtitle="NWS, USGS, NOAA, FEMA, Census, Iowa State" onPress={() => Linking.openURL(`${SITE}#/about`)} last />
          </Card>
          <Txt variant="caption" tone="muted" style={{ marginTop: space.xxl, marginBottom: space.s }}>
            What it can’t do
          </Txt>
          {LIMITS.map((l) => (
            <View key={l} style={s.bullet}>
              <View style={[s.dot, { backgroundColor: c.inkFaint }]} />
              <Txt variant="callout" tone="muted" style={{ flex: 1 }}>
                {l}
              </Txt>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <SectionHeader title="Settings" />
          <Card style={{ gap: space.l }}>
            <View style={{ gap: space.s }}>
              <Txt variant="headline">Appearance</Txt>
              <SegmentedControl<Appearance>
                label="Appearance"
                value={appearance}
                onChange={setAppearance}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </View>
            <View style={[s.switchRow, { borderTopColor: c.hairline }]}>
              <View style={{ flex: 1 }}>
                <Txt variant="headline">Haptics</Txt>
                <Txt variant="footnote">Light vibrations when you tap and when the status changes</Txt>
              </View>
              <Switch
                value={haptics}
                onValueChange={(on) => {
                  setHaptics(on);
                  if (on) haptic.select();
                }}
                trackColor={{ true: c.accent, false: c.surfaceSunken }}
                accessibilityLabel="Haptics"
              />
            </View>
          </Card>
        </View>

        <View style={s.section}>
          <SectionHeader title="About" />
          <Card style={{ gap: space.m }}>
            <Wordmark size={44} motto />
            <Txt variant="callout">
              {`${APP_NAME} turns official public data into a clear status for the 8 counties of South Carolina’s 5th District, using fixed, written rules. There’s no AI in the app.`}
            </Txt>
            <Txt variant="callout" tone="muted">
              Built by a high school student in York County for the 2026 Congressional App Challenge, with help from an AI coding assistant (see the AI disclosure in the code repository).
            </Txt>
            <Txt variant="callout" tone="muted">
              Privacy: no accounts, no ads, no tracking. Your location stays on your phone and is never stored. Only your chosen county and settings are remembered here.
            </Txt>
            <ListRow
              icon="RotateCcw"
              title="Show the introduction again"
              onPress={() => {
                platform().storage.setItem(ONBOARDED_KEY, '0');
                router.replace('/onboarding');
              }}
              last
            />
          </Card>
          <Pressable onLongPress={() => router.push('/gallery')} delayLongPress={600} accessibilityRole="text" accessibilityLabel={`Version ${Constants.expoConfig?.version ?? '1.0.0'}`}>
            <Txt variant="footnote" style={{ textAlign: 'center', marginTop: space.xxl }}>
              {`${APP_NAME} ${Constants.expoConfig?.version ?? '1.0.0'} · Not an official warning system`}
            </Txt>
          </Pressable>
        </View>
      </LargeTitleScroll>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { marginTop: space.x3 },
  bullet: { flexDirection: 'row', gap: space.m, marginBottom: space.s },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingTop: space.l, borderTopWidth: StyleSheet.hairlineWidth },
});
