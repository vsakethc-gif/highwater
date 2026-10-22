/**
 * alert/[id].tsx — one official alert (brief section 8.4): what it is in plain words first,
 * then the official National Weather Service text, and a link to the official alert.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { classifyAlert } from '../../../../shared/hazards/alertMap';
import { HAZARDS } from '../../../../shared/hazards/hazards';
import { LEVELS } from '../../../../shared/hazards/levels';
import { countyName } from '../../../../shared/places';
import { dateTime, relativeTime } from '../../../../shared/time';
import { Icon } from '../../components/Icon';
import { Button, IconButton, Pressable } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Chips';
import { EmptyState } from '../../components/ui/Feedback';
import { Card, SectionHeader } from '../../components/ui/Layout';
import { Screen } from '../../components/ui/Screen';
import { Txt } from '../../components/ui/Text';
import { latestStatus } from '../../hooks/useStatus';
import { fadeIn, radius, SCREEN_PAD, space, useTheme } from '../../theme';

const OFFICIAL = 'https://www.weather.gov/alerts';

/** A time both ways, relative then exact: "in 2 hours · Thu, Oct 22, 8:00 PM". */
function both(iso: string): string {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60_000);
  if (minutes <= 0) return `${relativeTime(iso)} · ${dateTime(iso)}`;
  const rel = minutes < 60 ? `in ${minutes} min` : minutes < 48 * 60 ? `in ${Math.round(minutes / 60)} hours` : `in ${Math.round(minutes / 1440)} days`;
  return `${rel} · ${dateTime(iso)}`;
}

export default function AlertDetail() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = latestStatus();
  const a = data && !(data.c.alerts instanceof Error) ? data.c.alerts.data.find((x) => x.id === id) : undefined;
  const [showText, setShowText] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  return (
    <Screen>
      <View style={s.top}>
        <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />
      </View>
      {!a ? (
        <View style={{ padding: SCREEN_PAD }}>
          <EmptyState title="This alert isn’t loaded right now." detail="It may have ended. Go back and pull down to refresh." action="Back" onAction={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PAD, paddingBottom: 140 }}>
          {(() => {
            const rule = classifyAlert(a);
            const hz = HAZARDS[rule.hazard];
            return (
              <Animated.View entering={fadeIn} style={{ gap: space.l }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
                  <View style={[s.icon, { backgroundColor: c.levels[rule.level].bg }]}>
                    <Icon name={hz.icon} size={24} tint={c.levels[rule.level].fg} />
                  </View>
                  <StatusBadge level={rule.level} />
                </View>
                <Txt variant="title2" accessibilityRole="header">
                  {a.event}
                </Txt>
                <Card style={{ gap: space.s }}>
                  <Txt variant="headline">In plain words</Txt>
                  <Txt>{`This is a ${LEVELS[rule.level].name}-level ${hz.label.toLowerCase()} alert from the National Weather Service. ${LEVELS[rule.level].meaning}`}</Txt>
                  {a.onset ? <Txt variant="footnote">{`Starts ${both(a.onset)}`}</Txt> : null}
                  {a.ends ? <Txt variant="footnote">{`Ends ${both(a.ends)}`}</Txt> : null}
                  <Txt variant="footnote">{`Counties: ${a.county_fips.map((f) => countyName(f)).filter((n) => n !== 'Unknown').join(', ') || 'see the official alert'}`}</Txt>
                </Card>
                <View>
                  <SectionHeader title="Official text" />
                  <Txt variant="callout">{a.headline}</Txt>
                  <Expander label={showText ? 'Hide the full description' : 'Read the full description'} open={showText} onToggle={() => setShowText(!showText)} />
                  {showText ? <Animated.View entering={fadeIn}><Txt variant="callout" tone="muted">{a.description}</Txt></Animated.View> : null}
                  {a.instruction ? (
                    <>
                      <Expander label={showSteps ? 'Hide what NWS says to do' : 'What NWS says to do'} open={showSteps} onToggle={() => setShowSteps(!showSteps)} />
                      {showSteps ? <Animated.View entering={fadeIn}><Txt variant="callout" tone="muted">{a.instruction}</Txt></Animated.View> : null}
                    </>
                  ) : null}
                </View>
                <Button label="View official alerts" icon="ExternalLink" onPress={() => Linking.openURL(OFFICIAL)} />
              </Animated.View>
            );
          })()}
        </ScrollView>
      )}
    </Screen>
  );
}

function Expander({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={label} scaleTo={0.99}>
      <View style={s.expander}>
        <Txt variant="headline" tone="accent">
          {label}
        </Txt>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="ChevronDown" size={18} tint={c.accent} />
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: space.s, paddingTop: space.xs, flexDirection: 'row' },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  expander: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
});
