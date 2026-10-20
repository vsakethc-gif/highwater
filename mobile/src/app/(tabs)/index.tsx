/**
 * Status tab — "What's going on here, and what should I do?"
 *
 * Flow (the same as the website, using the same shared code):
 *   pick a place → load alerts, gauges, and rain (live or Scenario Mode) → run the hazard engine
 *   → show the status card, why, what to do, and the data underneath.
 * Pull down to refresh; it also refreshes by itself every 10 minutes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { COUNTIES } from '../../../../shared/config';
import { dataOrNull, loadConditions, type Conditions } from '../../../../shared/data/conditions';
import { fetchFloodZone, describeZone, type FloodZone } from '../../../../shared/data/fema';
import type { Alert } from '../../../../shared/data/types';
import { guidanceFor } from '../../../../shared/guidance/guidance';
import type { GuidanceBlock } from '../../../../shared/guidance/types';
import { alertAppliesTo, evaluate } from '../../../../shared/hazards/engine';
import type { OverallStatus } from '../../../../shared/hazards/types';
import { districtAverage, type Tract } from '../../../../shared/hazards/vulnerability';
import { countyName, placeLabel } from '../../../../shared/places';
import { checksList, guidanceContext } from '../../../../shared/statusContext';
import { dateTime, relativeTime } from '../../../../shared/time';
import { AlertRow, FactsTable, GaugeRow, RainCard, SourceLine } from '../../components/data';
import { GuidanceView } from '../../components/guidance';
import { LocationPicker } from '../../components/LocationPicker';
import { OtherHazards, StatusCard, WhyStatus } from '../../components/status';
import { Notice, Screen, Section, Skeleton, Txt } from '../../components/ui';
import { useAppState } from '../../state';
import { fadeIn, font, space, tapHaptic, useTheme } from '../../theme';

const REFRESH_MS = 10 * 60_000;

interface Loaded {
  c: Conditions;
  overall: OverallStatus;
  blocks: GuidanceBlock[];
  alertsHere: Alert[] | null;
  checks: string[];
  zone: FloodZone | null | Error;
  tracts: Tract[];
  tract: Tract | null;
  updatedAt: string;
}

export default function StatusScreen() {
  const { c } = useTheme();
  const { place, scenario } = useAppState();
  const [data, setData] = useState<Loaded | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadId = useRef(0);

  const load = useCallback(async () => {
    const id = ++loadId.current;
    const conditions = await loadConditions(place, scenario);
    // FEMA's flood zone for a spot: never wait more than 4 seconds for it.
    const zone: FloodZone | null | Error =
      place.kind === 'point' && !scenario
        ? await Promise.race([fetchFloodZone(place.lat, place.lon).catch((e: Error) => e), new Promise<Error>((r) => setTimeout(() => r(new Error('slow')), 4000))])
        : null;
    if (id !== loadId.current) return; // a newer load started (the place changed): drop this one

    const alerts = dataOrNull(conditions.alerts);
    const alertsHere = alerts ? alerts.filter((a) => alertAppliesTo(a, place)) : null;
    const evaluated = evaluate({ alerts, gauges: dataOrNull(conditions.gauges), rain: dataOrNull(conditions.rain), now: Date.now() }, place);
    // A status built from the saved offline copy is never complete, so it can never be an all-clear.
    const overall: OverallStatus = conditions.savedAt
      ? { ...evaluated, complete: false, gaps: [`Offline: showing info saved ${relativeTime(conditions.savedAt)} (${dateTime(conditions.savedAt)}). It may be out of date.`, ...evaluated.gaps] }
      : evaluated;
    const { ctx, tract, tracts } = await guidanceContext(place, zone instanceof Error ? null : zone);
    const shown = overall.active.length ? overall.active : overall.all.filter((h) => h.hazard === 'flood');
    if (id !== loadId.current) return;
    setData({
      c: conditions,
      overall,
      blocks: shown.map((h) => guidanceFor(h, ctx)),
      alertsHere,
      checks: checksList(place, conditions, alertsHere),
      zone,
      tracts,
      tract,
      updatedAt: new Date().toISOString(),
    });
  }, [place, scenario]);

  useEffect(() => {
    setData(null);
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const onRefresh = useCallback(async () => {
    tapHaptic();
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const seat = COUNTIES.find((x) => x.fips === place.fips)?.seat.name ?? 'the county seat';
  const county = `${countyName(place.fips)} County`;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space[2], paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} progressBackgroundColor={c.surface} />}
      >
        <View style={{ paddingTop: space[3], gap: space[0] }}>
          <Txt variant="eyebrow">Hazard status</Txt>
          <Txt variant="serifTitle" accessibilityRole="header">
            {placeLabel(place)}
          </Txt>
          {place.kind === 'point' ? <Txt variant="meta">In {county}</Txt> : null}
        </View>
        <View style={{ marginTop: space[2] }}>
          <LocationPicker />
        </View>

        {!data ? (
          // Placeholders shaped like the real content, so nothing jumps when it arrives.
          <View>
            <Skeleton height={300} />
            <Skeleton height={48} />
            <Skeleton height={120} style={{ marginTop: space[5] }} />
          </View>
        ) : (
          <Animated.View entering={fadeIn}>
            <StatusCard overall={data.overall} top={data.blocks[0]} placeName={placeLabel(place)} updatedAt={data.updatedAt} simulated={data.c.simulated} live={!data.c.simulated && !data.c.savedAt && data.overall.complete} />
            <OtherHazards active={data.overall.active} />
            <WhyStatus overall={data.overall} checks={data.checks} />

            <GuidanceView g={data.blocks[0]} />

            <PlaceFacts data={data} />

            <Section title="Official alerts">
              {data.c.alerts instanceof Error || data.alertsHere === null ? (
                <Notice tone="error" icon="CloudOff" title="Couldn’t load alerts from the National Weather Service.">
                  Check official alerts at weather.gov/alerts.
                </Notice>
              ) : data.alertsHere.length ? (
                <>
                  {data.alertsHere.map((a, i) => (
                    <AlertRow key={a.id} a={a} index={i} />
                  ))}
                  <SourceLine loaded={data.c.alerts} />
                </>
              ) : (
                <>
                  <Notice tone="empty" icon="CircleCheck">{`No active National Weather Service alerts for ${placeLabel(place)} right now.`}</Notice>
                  <SourceLine loaded={data.c.alerts} />
                </>
              )}
            </Section>

            <Section title="Rain forecast">
              {data.c.rain instanceof Error ? (
                <Notice tone="error" icon="CloudOff" title="Couldn’t load the rain forecast.">
                  Alerts and river levels may still be working.
                </Notice>
              ) : (
                <RainCard rain={data.c.rain} where={place.kind === 'point' ? 'this spot' : `${seat} (county seat)`} />
              )}
            </Section>

            <Section title={`Rivers and streams in ${county}`}>
              <Txt style={{ marginBottom: space[1] }}>
                <Txt style={{ fontFamily: font.bold }}>Gage height</Txt> is how high the water surface is at a USGS gauge, in feet. <Txt style={{ fontFamily: font.bold }}>Flood stage</Txt> is the height where the National Weather Service says flooding begins there. The tube beside each gauge shows the water against its flood stage (solid line) and action stage (dashed).
              </Txt>
              <Gauges data={data} fips={place.fips} county={county} />
            </Section>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Gauges({ data, fips, county }: { data: Loaded; fips: string; county: string }) {
  if (data.c.gauges instanceof Error) {
    return (
      <Notice tone="error" icon="CloudOff" title="Couldn’t load river levels from USGS.">
        Alerts may still be working. You can also check waterdata.usgs.gov.
      </Notice>
    );
  }
  const list = data.c.gauges.data.filter((g) => g.county_fips === fips);
  if (!list.length) return <Notice tone="empty" icon="Waves">{`There are no active USGS stream gauges in ${county}.`}</Notice>;
  const rank = { major: 4, moderate: 3, minor: 2, action: 1 } as const;
  list.sort((a, b) => (b.flood_category ? rank[b.flood_category] : 0) - (a.flood_category ? rank[a.flood_category] : 0) || a.name.localeCompare(b.name));
  return (
    <>
      {list.map((g, i) => (
        <GaugeRow key={g.site_id} g={g} index={i} />
      ))}
      <SourceLine loaded={data.c.gauges} extra={data.c.gauges.source.startsWith('Scenario') ? 'Simulated or replayed readings.' : 'Provisional data: USGS may revise these readings.'} />
    </>
  );
}

/** "About this spot" (FEMA zone + tract) or "About this county" (who lives here vs. the SC-5 average). */
function PlaceFacts({ data }: { data: Loaded }) {
  const { place } = useAppState();
  const avg = (m: 'pct_65plus' | 'pct_no_vehicle' | 'pct_poverty') => districtAverage(data.tracts, m);
  const inCounty = data.tracts.filter((t) => t.county_fips === place.fips);
  const subject = place.kind === 'point' ? data.tract : null;
  const here = (m: 'pct_65plus' | 'pct_no_vehicle' | 'pct_poverty', w: 'population' | 'households' = 'population') => (subject ? subject[m] : districtAverage(inCounty, m, w));
  const showPeople = data.tracts.length > 0 && (place.kind === 'county' || subject);
  if (!showPeople && place.kind === 'county') return null;
  return (
    <Section title={place.kind === 'point' ? 'About this spot' : 'About this county'}>
      {place.kind === 'point' ? (
        <View style={{ gap: space[0], marginBottom: space[3] }}>
          <Txt variant="label">FEMA flood zone at this spot</Txt>
          {data.zone instanceof Error ? (
            <Txt>Couldn’t reach FEMA’s flood map right now.</Txt>
          ) : data.zone === null ? (
            <Txt>No digital FEMA flood map covers this spot.</Txt>
          ) : (
            <>
              <Txt variant="subheading">Zone {data.zone.zone}</Txt>
              <Txt>{describeZone(data.zone)}</Txt>
            </>
          )}
          <Txt variant="meta">Long-term flood risk from FEMA maps, not current flooding, and not an official determination for a property.</Txt>
        </View>
      ) : null}
      {showPeople ? (
        <FactsTable
          title={place.kind === 'point' ? 'People in this neighborhood (census tract)' : `People in ${countyName(place.fips)} County`}
          rows={[
            { label: 'Age 65 and older', here: here('pct_65plus'), avg: avg('pct_65plus') },
            { label: 'Households without a car', here: here('pct_no_vehicle', 'households'), avg: avg('pct_no_vehicle') },
            { label: 'Below the poverty line', here: here('pct_poverty'), avg: avg('pct_poverty') },
          ]}
        />
      ) : null}
    </Section>
  );
}
