/**
 * Status tab (brief section 8.2) — "What's happening near me, and what do I do?"
 *
 *   header: large "Status" title, the county pill (opens the county picker), and the live indicator
 *   hero:   the status card with the water line, then "Why this status?"
 *   then:   other active hazards, the "Do this now" checklist, official alerts, rivers near you,
 *           the rain forecast, quick actions, and the footer with 911 and sources.
 *
 * Everything comes from the shared engine through useStatus(). Pull down to refresh.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { COUNTIES } from '../../../../shared/config';
import { routeAllowed } from '../../../../shared/guidance/guidance';
import { countyName, placeLabel } from '../../../../shared/places';
import { clockTime, relativeTime } from '../../../../shared/time';
import { RainBars } from '../../components/data/Charts';
import { AlertRow, ChecklistItem, GaugeRow } from '../../components/data/Rows';
import { StatusHero, WhyStatus } from '../../components/data/StatusHero';
import { Icon } from '../../components/Icon';
import { Button, Pressable } from '../../components/ui/Button';
import { HazardChip } from '../../components/ui/Chips';
import { Banner, EmptyState, Notice, Skeleton } from '../../components/ui/Feedback';
import { Card, ListRow, SectionHeader } from '../../components/ui/Layout';
import { LargeTitleScroll, Screen } from '../../components/ui/Screen';
import { Txt } from '../../components/ui/Text';
import { useStatus, type StatusData } from '../../hooks/useStatus';
import { useAppState } from '../../state';
import { easing, fadeIn, haptic, radius, space, useMotionReduced, useTheme } from '../../theme';

export default function StatusScreen() {
  const { c } = useTheme();
  const { place } = useAppState();
  const { data, refreshing, refresh } = useStatus();
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <Screen>
      {data?.c.savedAt ? <Banner kind="offline" title={`Offline · showing info from ${clockTime(data.c.savedAt)}`} detail="Live data will update when you have signal." /> : null}
      <LargeTitleScroll
        title="Status"
        right={data ? <LiveIndicator data={data} /> : null}
        header={<CountyPill />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              haptic.press();
              refresh();
            }}
            tintColor={c.accent}
            colors={[c.accent]}
            progressBackgroundColor={c.surface}
          />
        }
      >
        {!data ? (
          <Loading />
        ) : (
          <Animated.View entering={fadeIn} style={{ marginTop: space.l }}>
            <StatusHero overall={data.overall} top={data.blocks[0]} placeName={placeLabel(place)} onPress={() => setWhyOpen(true)} />
            <WhyStatus overall={data.overall} checks={data.checks} open={whyOpen} onToggle={() => setWhyOpen(!whyOpen)} />

            {data.overall.active.length > 1 ? (
              <View style={s.section}>
                <SectionHeader title="Also active here" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
                  {data.overall.active.slice(1).map((h) => (
                    <HazardChip key={h.hazard} hazard={h.hazard} level={h.level} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <DoThisNow data={data} />
            <Alerts data={data} />
            <Rivers data={data} />

            <View style={s.section}>
              <SectionHeader title="Rain forecast" />
              {data.c.rain instanceof Error ? (
                <Notice title="Couldn’t load the rain forecast." detail="Alerts and river levels may still be working." onRetry={refresh} />
              ) : (
                <Card>
                  <RainBars next24={data.c.rain.data.next24h_in} next48={data.c.rain.data.next48h_in} />
                  <Txt variant="footnote" style={{ marginTop: space.m }}>
                    {`For ${place.kind === 'point' ? 'this spot' : `${COUNTIES.find((x) => x.fips === place.fips)?.seat.name ?? 'the county seat'}`} · ${data.c.rain.source}. 2 inches or more in 24 hours (dashed line) raises flooding to Watch.`}
                  </Txt>
                </Card>
              )}
            </View>

            <QuickActions data={data} />
            <Footer />
          </Animated.View>
        )}
      </LargeTitleScroll>
    </Screen>
  );
}

/** "York County ▾": opens the county picker sheet. Shows a location icon when the place came from GPS. */
function CountyPill() {
  const { c } = useTheme();
  const { place } = useAppState();
  return (
    <Pressable onPress={() => router.push('/county')} accessibilityRole="button" accessibilityLabel={`${placeLabel(place)}. Change place`} style={{ alignSelf: 'flex-start' }}>
      <View style={[s.pill, { backgroundColor: c.surface, borderColor: c.hairline }]}>
        <Icon name={place.kind === 'point' ? 'Navigation' : 'MapPin'} size={16} tint={c.accent} />
        <Txt variant="headline">{placeLabel(place)}</Txt>
        <Icon name="ChevronDown" size={16} tint={c.inkMuted} />
      </View>
      {place.kind === 'point' ? (
        <Txt variant="footnote" style={{ marginTop: space.xs }}>
          In {countyName(place.fips)} County
        </Txt>
      ) : null}
    </Pressable>
  );
}

/** "Live · 3 min ago" with a softly pulsing dot; "Simulated", "Offline", or "Some data missing" otherwise. */
function LiveIndicator({ data }: { data: StatusData }) {
  const { c } = useTheme();
  const reduced = useMotionReduced();
  const ping = useSharedValue(0);
  const live = !data.c.simulated && !data.c.savedAt && data.overall.complete;
  useEffect(() => {
    if (live && !reduced) ping.value = withRepeat(withTiming(1, { duration: 2000, easing: easing.emphasized }), -1, false);
  }, [live, reduced, ping]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - ping.value), transform: [{ scale: 1 + 1.6 * ping.value }] }));
  const label = data.c.simulated ? 'Simulated' : data.c.savedAt ? `Offline · from ${clockTime(data.c.savedAt)}` : live ? `Live · ${relativeTime(data.updatedAt)}` : 'Some data missing';
  const dot = data.c.simulated ? c.inkFaint : data.c.savedAt || !live ? c.levels[1].fg : c.levels[0].fg;
  return (
    <View style={s.live} accessible accessibilityLabel={label}>
      <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
        {live ? <Animated.View style={[s.dot, { position: 'absolute', backgroundColor: dot }, ring]} /> : null}
        <View style={[s.dot, { backgroundColor: dot }]} />
      </View>
      <Txt variant="footnote" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

function Loading() {
  // Placeholders shaped like the real content, so nothing jumps when it arrives.
  return (
    <View style={{ marginTop: space.l, gap: space.m }}>
      <Skeleton height={248} radius={radius.lg} />
      <Skeleton height={52} />
      <Skeleton height={14} width="30%" style={{ marginTop: space.x3 }} />
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </View>
  );
}

function DoThisNow({ data }: { data: StatusData }) {
  const { c } = useTheme();
  const g = data.blocks[0];
  const shelter = g.shelterInPlace && g.level >= 1;
  return (
    <View style={s.section}>
      <SectionHeader title="Do this now" />
      <View style={{ gap: space.s }}>
        {shelter ? (
          <Card style={{ flexDirection: 'row', gap: space.m }}>
            <Icon name="House" size={22} />
            <Txt style={{ flex: 1 }}>
              <Txt variant="headline">Stay where you are and take shelter. </Txt>
              For this kind of danger, driving away puts you at more risk, so this app doesn’t offer a route out.
            </Txt>
          </Card>
        ) : null}
        {g.doNow.map((step, i) => (
          <ChecklistItem key={step} storageKey={`sc5ready.check.${g.hazard}.${g.level}.${i}`} text={step} number={i + 1} />
        ))}
      </View>
      <Txt variant="caption" tone="muted" style={{ marginTop: space.xxl, marginBottom: space.s }}>
        If it gets worse
      </Txt>
      {g.ifWorse.map((line) => (
        <View key={line} style={s.bullet}>
          <View style={[s.bulletDot, { backgroundColor: c.inkFaint }]} />
          <Txt style={{ flex: 1 }}>{line}</Txt>
        </View>
      ))}
      <Txt variant="caption" tone="muted" style={{ marginTop: space.l, marginBottom: space.s }}>
        Check on others
      </Txt>
      <Txt>{g.checkOnOthers}</Txt>
      <Txt variant="caption" tone="muted" style={{ marginTop: space.l }}>
        Official guidance
      </Txt>
      {g.links.map((l, i) => (
        <ListRow key={l.url} title={l.label} icon="ExternalLink" onPress={() => Linking.openURL(l.url)} last={i === g.links.length - 1} chevron={false} hint="Opens in your browser" />
      ))}
    </View>
  );
}

function Alerts({ data }: { data: StatusData }) {
  const { place } = useAppState();
  return (
    <View style={s.section}>
      <SectionHeader title="Official alerts" />
      {data.c.alerts instanceof Error || data.alertsHere === null ? (
        <Notice title="Couldn’t load alerts from the National Weather Service." detail="Check official alerts at weather.gov/alerts." />
      ) : data.alertsHere.length ? (
        <Card style={{ paddingVertical: 0 }}>
          {data.alertsHere.map((a, i) => (
            <AlertRow key={a.id} a={a} index={i} last={i === data.alertsHere!.length - 1} />
          ))}
        </Card>
      ) : (
        <Card>
          <Txt variant="callout">{`No active National Weather Service alerts for ${placeLabel(place)} right now.`}</Txt>
          <Txt variant="footnote" style={{ marginTop: space.xs }}>{`Checked ${clockTime(data.c.alerts.fetched_at)} · ${data.c.alerts.source}`}</Txt>
        </Card>
      )}
    </View>
  );
}

function Rivers({ data }: { data: StatusData }) {
  const { place } = useAppState();
  const county = `${countyName(place.fips)} County`;
  if (data.c.gauges instanceof Error) {
    return (
      <View style={s.section}>
        <SectionHeader title="Rivers near you" />
        <Notice title="Couldn’t load river levels from USGS." detail="Alerts may still be working. You can also check waterdata.usgs.gov." />
      </View>
    );
  }
  const list = data.c.gauges.data.filter((g) => g.county_fips === place.fips);
  const rank = { major: 4, moderate: 3, minor: 2, action: 1 } as const;
  list.sort((a, b) => (b.flood_category ? rank[b.flood_category] : 0) - (a.flood_category ? rank[a.flood_category] : 0) || Number(b.has_official_stage) - Number(a.has_official_stage) || a.name.localeCompare(b.name));
  return (
    <View style={s.section}>
      <SectionHeader title="Rivers near you" />
      {list.length ? (
        <>
          <Card style={{ paddingVertical: 0 }}>
            {list.map((g, i) => (
              <GaugeRow key={g.site_id} g={g} index={i} last={i === list.length - 1} />
            ))}
          </Card>
          <Txt variant="footnote" style={{ marginTop: space.s }}>
            {`Gage height is how high the water is, in feet. The tube shows it against action stage (dashed) and flood stage (solid). ${data.c.gauges.source.startsWith('Scenario') ? 'Simulated or replayed readings.' : 'Provisional USGS data: readings may be revised.'}`}
          </Txt>
        </>
      ) : (
        <EmptyState title={`There are no river gauges in ${county}.`} detail="Official alerts and the rain forecast still count. Open the map to see gauges in nearby counties." action="Open the map" onAction={() => router.navigate('/map')} />
      )}
    </View>
  );
}

function QuickActions({ data }: { data: StatusData }) {
  const canLeave = routeAllowed(data.blocks);
  return (
    <View style={[s.section, { gap: space.s }]}>
      {canLeave ? <Button label="Plan a route out" icon="Signpost" kind="primary" onPress={() => router.navigate('/route')} /> : null}
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <Button label="Report a problem" icon="Megaphone" onPress={() => router.navigate('/report')} style={{ flex: 1 }} compact />
        <Button label="Open map" icon="Map" onPress={() => router.navigate('/map')} style={{ flex: 1 }} compact />
      </View>
    </View>
  );
}

function Footer() {
  const { c } = useTheme();
  return (
    <View style={[s.footer, { borderTopColor: c.hairline }]}>
      <Pressable onPress={() => Linking.openURL('tel:911')} accessibilityRole="button" accessibilityLabel="Call 911" style={{ alignSelf: 'flex-start' }}>
        <View style={s.call}>
          <Icon name="Phone" size={18} tint={c.levels[3].fg} />
          <Txt variant="headline" color={c.levels[3].fg}>
            Call 911
          </Txt>
        </View>
      </Pressable>
      <Txt variant="footnote">Not an official warning system. Follow instructions from local officials. Sources: NWS, USGS, FEMA, Census.</Txt>
      <Pressable onPress={() => router.navigate('/more')} accessibilityRole="link" accessibilityLabel="How it works" style={{ alignSelf: 'flex-start' }}>
        <Txt variant="footnote" tone="accent" style={{ paddingVertical: space.s }}>
          How it works ›
        </Txt>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: space.x3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: 44, paddingHorizontal: space.l, borderWidth: 1, borderRadius: radius.pill },
  live: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bullet: { flexDirection: 'row', gap: space.m, marginBottom: space.s },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 10 },
  footer: { marginTop: space.x4, paddingTop: space.l, borderTopWidth: StyleSheet.hairlineWidth, gap: space.s },
  call: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: 44 },
});
