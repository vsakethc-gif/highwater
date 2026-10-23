/**
 * Map tab (brief section 8.5) — the whole district on a native map (Apple Maps on iPhone, Google Maps
 * on Android).
 *
 *   Layers (one button opens the list): official alert areas, river gauges, community reports, and one
 *   way to color neighborhoods (Vulnerability, Flood zones, or Priority). The map starts plain on
 *   purpose: counties, alerts, and the gauges that have official flood stages. Gauges without a flood
 *   stage appear once you zoom in, so the district view isn't covered in dots.
 *   Tap a neighborhood, gauge, alert area, or report: a bottom sheet rises with its details.
 *   The place pill flies the camera to a county; "List" shows the same information as an accessible list.
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import MapView, { Marker, Polygon, type LatLng, type Region } from 'react-native-maps';
import Animated, { FadeIn, ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COUNTIES } from '../../../../shared/config';
import type { CountyCollection } from '../../../../shared/data/static';
import type { Alert, Gauge } from '../../../../shared/data/types';
import { feet, gaugeName } from '../../../../shared/format';
import { classifyAlert } from '../../../../shared/hazards/alertMap';
import { HAZARDS } from '../../../../shared/hazards/hazards';
import { LEVELS, type Level } from '../../../../shared/hazards/levels';
import { districtAverage, scoreBand, type Tract } from '../../../../shared/hazards/vulnerability';
import { categoryInfo } from '../../../../shared/reports/categories';
import type { Report } from '../../../../shared/reports/client';
import { countyName } from '../../../../shared/places';
import { clockTime, relativeTime } from '../../../../shared/time';
import { CATEGORY, stageSentence } from '../../components/data/Rows';
import { Icon } from '../../components/Icon';
import { googleDark, googleLight, RAMP, RAMP_LABELS, RAMP_NONE, rampColor, withAlpha } from '../../components/map/mapStyle';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';
import { Button, IconButton, Pressable } from '../../components/ui/Button';
import { SegmentedControl, StatusBadge } from '../../components/ui/Chips';
import { Notice } from '../../components/ui/Feedback';
import { ListRow } from '../../components/ui/Layout';
import { SimulationBanner } from '../../components/ui/Screen';
import { Sheet } from '../../components/ui/Sheet';
import { Txt } from '../../components/ui/Text';
import { useMapData, type MapData } from '../../hooks/useMapData';
import { elevation, haptic, radius, SCREEN_PAD, space, useTheme } from '../../theme';

type ScoreLayer = 'vulnerability_score' | 'exposure_score' | 'priority_score' | null;
type Selection =
  | { kind: 'tract'; tract: Tract }
  | { kind: 'gauge'; gauge: Gauge }
  | { kind: 'alert'; alert: Alert }
  | { kind: 'report'; report: Report }
  | { kind: 'list' }
  | { kind: 'places' }
  | { kind: 'layers' }
  | null;

const SCORE_LABEL: Record<Exclude<ScoreLayer, null>, string> = { vulnerability_score: 'Vulnerability', exposure_score: 'Flood zones', priority_score: 'Priority' };
const SCORE_HELP: Record<Exclude<ScoreLayer, null>, string> = {
  vulnerability_score: 'Where more people are 65 or older, have no car, live below the poverty line, or have a disability, compared with the rest of SC-5.',
  exposure_score: 'How much of the neighborhood is inside FEMA’s high-risk flood zone, compared with the rest of SC-5.',
  priority_score: 'Vulnerability and flood exposure together: where people with the fewest resources are most exposed.',
};

/** GeoJSON [lon, lat] rings → map coordinates. */
const toLatLng = (ring: number[][]): LatLng[] => ring.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
function polygonParts(g: GeoJSON.Polygon | GeoJSON.MultiPolygon): number[][][][] {
  return g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
}

function regionFor(features: CountyCollection['features']): Region {
  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  for (const f of features) for (const part of polygonParts(f.geometry)) for (const [lon, lat] of part[0]) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  }
  return { latitude: (minLat + maxLat) / 2, longitude: (minLon + maxLon) / 2, latitudeDelta: (maxLat - minLat) * 1.25, longitudeDelta: (maxLon - minLon) * 1.25 };
}

export default function MapScreen() {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, error, reload } = useMapData();
  const map = useRef<ComponentRef<typeof MapView>>(null);
  const [layers, setLayers] = useState({ alerts: true, gauges: true, reports: true });
  const [score, setScore] = useState<ScoreLayer>(null);
  const [zoomedIn, setZoomedIn] = useState(false);
  const [selected, setSelected] = useState<Selection>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [moved, setMoved] = useState(false);

  const home = useMemo(() => (data ? regionFor(data.counties.features) : null), [data]);
  const flyTo = (r: Region) => map.current?.animateToRegion(r, 450);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {home ? (
        <MapView
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={home}
          mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
          customMapStyle={Platform.OS === 'android' ? (isDark ? googleDark : googleLight) : undefined}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          showsUserLocation
          showsPointsOfInterests={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onRegionChangeComplete={(r) => {
            setMoved(true);
            setZoomedIn(r.latitudeDelta < 0.6);
          }}
          onPress={() => setSelected(null)}
          mapPadding={{ top: insets.top + 64, bottom: TAB_BAR_HEIGHT + insets.bottom, left: 0, right: 0 }}
        >
          {data ? <Layers data={data} layers={layers} score={score} zoomedIn={zoomedIn} onSelect={(s) => { haptic.select(); setSelected(s); }} /> : null}
        </MapView>
      ) : null}

      {/* Floating controls over the map */}
      <View style={[s.top, { paddingTop: insets.top }]} pointerEvents="box-none">
        <SimulationBanner />
        <View style={s.topRow} pointerEvents="box-none">
          <Pressable onPress={() => setSelected({ kind: 'places' })} accessibilityRole="button" accessibilityLabel="Jump to a county">
            <View style={[s.pill, { backgroundColor: c.surface }, elevation(c, isDark, 2)]}>
              <Icon name="MapPin" size={16} tint={c.accent} />
              <Txt variant="headline">SC-5 district</Txt>
              <Icon name="ChevronDown" size={16} tint={c.inkMuted} />
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: space.s }}>
            <IconButton icon="Layers" label="Choose map layers" onPress={() => setSelected({ kind: 'layers' })} filled />
            <IconButton icon="Menu" label="List view of the map" onPress={() => setSelected({ kind: 'list' })} filled />
            {moved && home ? (
              <Animated.View entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}>
                <IconButton icon="Crosshair" label="Recenter the map" onPress={() => { flyTo(home); setMoved(false); }} filled />
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>

      {!data && !error ? (
        <View style={[s.center, { backgroundColor: c.bg }]} pointerEvents="none">
          <Txt variant="callout" tone="muted">
            Loading the district map…
          </Txt>
        </View>
      ) : null}
      {error ? (
        <View style={{ position: 'absolute', left: SCREEN_PAD, right: SCREEN_PAD, top: insets.top + 120 }}>
          <Notice title={error} detail="The Status tab may still work." onRetry={reload} />
        </View>
      ) : null}

      {/* Legend: compact card, tap to open the full key */}
      {data && score ? (
        <View style={[s.legendWrap, { bottom: TAB_BAR_HEIGHT + insets.bottom + space.m }]} pointerEvents="box-none">
          <Legend open={legendOpen} onToggle={() => setLegendOpen(!legendOpen)} score={score} layers={layers} />
        </View>
      ) : null}

      <Sheet open={selected !== null} onClose={() => setSelected(null)} snaps={selected?.kind === 'list' || selected?.kind === 'places' ? [0.6, 0.9] : selected?.kind === 'layers' ? [0.62, 0.9] : [0.42, 0.85]} title={sheetTitle(selected)}>
        {data && selected ? (
          <SheetBody
            selection={selected}
            data={data}
            layers={layers}
            onLayers={setLayers}
            score={score}
            onScore={setScore}
            onFly={(fips) => {
              const f = data.counties.features.filter((x) => x.properties.fips === fips);
              if (f.length) flyTo(regionFor(f));
              setSelected(null);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function sheetTitle(sel: Selection): string | undefined {
  if (!sel) return undefined;
  if (sel.kind === 'tract') return `Census tract ${sel.tract.geoid.slice(5).replace(/^0+/, '').replace(/(\d+)(\d\d)$/, '$1.$2').replace(/\.00$/, '')}`;
  if (sel.kind === 'gauge') return gaugeName(sel.gauge.name);
  if (sel.kind === 'alert') return sel.alert.event;
  if (sel.kind === 'report') return `${categoryInfo(sel.report.category).label} (unverified)`;
  if (sel.kind === 'list') return 'Counties at a glance';
  if (sel.kind === 'layers') return 'Map layers';
  return 'Jump to a county';
}

/** Everything drawn on the map. Memoized pieces keep panning smooth. */
function Layers({ data, layers, score, zoomedIn, onSelect }: { data: MapData; layers: { alerts: boolean; gauges: boolean; reports: boolean }; score: ScoreLayer; zoomedIn: boolean; onSelect: (s: Selection) => void }) {
  const { c } = useTheme();
  const tractShapes = useMemo(
    () => data.tracts.features.flatMap((f) => polygonParts(f.geometry).map((part, i) => ({ key: `${f.properties.geoid}-${i}`, tract: f.properties, outer: toLatLng(part[0]), holes: part.slice(1).map(toLatLng) }))),
    [data.tracts],
  );
  const countyShapes = useMemo(() => data.counties.features.flatMap((f) => polygonParts(f.geometry).map((part, i) => ({ key: `${f.properties.fips}-${i}`, outer: toLatLng(part[0]) }))), [data.counties]);
  const alerts = useMemo(() => {
    if (data.c.alerts instanceof Error) return [];
    const out: { key: string; alert: Alert; level: Level; outer: LatLng[] }[] = [];
    for (const a of data.c.alerts.data) {
      const { level } = classifyAlert(a);
      if (level === 0 || !a.geometry || (a.geometry.type !== 'Polygon' && a.geometry.type !== 'MultiPolygon')) continue;
      polygonParts(a.geometry).forEach((part, i) => out.push({ key: `${a.id}-${i}`, alert: a, level, outer: toLatLng(part[0]) }));
    }
    return out.sort((x, y) => x.level - y.level);
  }, [data.c.alerts]);
  // At district zoom, only gauges with an official flood stage (the ones that can change a status).
  const gauges = (data.c.gauges instanceof Error ? [] : data.c.gauges.data).filter((g) => zoomedIn || g.has_official_stage || g.flood_category);
  const reports = data.reports instanceof Error ? [] : data.reports;

  return (
    <>
      {score
        ? tractShapes.map((t) => (
            <Polygon
              key={t.key}
              coordinates={t.outer}
              holes={t.holes}
              fillColor={withAlpha(rampColor(t.tract[score]), 0.5)}
              strokeColor="transparent"
              strokeWidth={0}
              tappable
              onPress={() => onSelect({ kind: 'tract', tract: t.tract })}
            />
          ))
        : null}
      {countyShapes.map((k) => (
        <Polygon key={k.key} coordinates={k.outer} fillColor="transparent" strokeColor={withAlpha(c.ink, 0.7)} strokeWidth={1} />
      ))}
      {layers.alerts
        ? alerts.map((a) => (
            <Polygon key={a.key} coordinates={a.outer} fillColor={withAlpha(c.levels[a.level].fg, 0.18)} strokeColor={c.levels[a.level].fg} strokeWidth={2} tappable onPress={() => onSelect({ kind: 'alert', alert: a.alert })} />
          ))
        : null}
      {layers.gauges
        ? gauges.map((g) => (
            <Marker key={g.site_id} coordinate={{ latitude: g.lat, longitude: g.lon }} onPress={() => onSelect({ kind: 'gauge', gauge: g })} tracksViewChanges={false} accessibilityLabel={`${gaugeName(g.name)} gauge`}>
              <GaugeDot g={g} />
            </Marker>
          ))
        : null}
      {layers.reports
        ? reports.map((r) => (
            <Marker key={r.id} coordinate={{ latitude: r.lat, longitude: r.lon }} onPress={() => onSelect({ kind: 'report', report: r })} tracksViewChanges={false} accessibilityLabel={`${categoryInfo(r.category).label}, unverified report`}>
              <View style={[s.reportDot, { backgroundColor: c.levels[1].bg, borderColor: c.levels[1].fg }]}>
                <Icon name={categoryInfo(r.category).icon} size={11} tint={c.levels[1].fg} />
              </View>
            </Marker>
          ))
        : null}
    </>
  );
}

/** A gauge marker: a ring in the flood category's color (or blue), filled when it has an official stage. */
function GaugeDot({ g }: { g: Gauge }) {
  const { c } = useTheme();
  const level = g.flood_category ? CATEGORY[g.flood_category].level : null;
  const ring = level ? c.levels[level].fg : c.accent;
  return (
    <Animated.View entering={ZoomIn.duration(250).reduceMotion(ReduceMotion.System)} style={[s.gauge, { borderColor: ring, backgroundColor: g.has_official_stage ? ring : c.surface }]}>
      <View style={[s.gaugeCore, { backgroundColor: c.surface }]} />
    </Animated.View>
  );
}

function Legend({ open, onToggle, score, layers }: { open: boolean; onToggle: () => void; score: ScoreLayer; layers: { alerts: boolean; gauges: boolean; reports: boolean } }) {
  const { c, isDark } = useTheme();
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={open ? 'Hide map key' : 'Show map key'} scaleTo={0.98}>
      <View style={[s.legend, { backgroundColor: c.surface }, elevation(c, isDark, 2)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Icon name="Layers" size={16} />
          <Txt variant="footnote" tone="ink">
            {score ? `${SCORE_LABEL[score]} (0–100)` : 'Map key'}
          </Txt>
          {!open && score ? (
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {RAMP.map((col) => (
                <View key={col} style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: col }} />
              ))}
            </View>
          ) : null}
        </View>
        {open ? (
          <Animated.View entering={FadeIn.duration(200)} style={{ gap: space.xs, marginTop: space.s, maxWidth: 260 }}>
            {score ? (
              <>
                <Txt variant="footnote">{SCORE_HELP[score]}</Txt>
                {RAMP.map((col, i) => (
                  <View key={col} style={s.legendRow}>
                    <View style={[s.swatch, { backgroundColor: col }]} />
                    <Txt variant="footnote" tone="ink">{RAMP_LABELS[i]}</Txt>
                  </View>
                ))}
                <View style={s.legendRow}>
                  <View style={[s.swatch, { backgroundColor: RAMP_NONE }]} />
                  <Txt variant="footnote" tone="ink">Insufficient data</Txt>
                </View>
              </>
            ) : null}
            {layers.alerts ? (
              <View style={s.legendRow}>
                <View style={[s.swatch, { borderWidth: 2, borderColor: c.levels[2].fg, backgroundColor: withAlpha(c.levels[2].fg, 0.18) }]} />
                <Txt variant="footnote" tone="ink">Official warning area (color = level)</Txt>
              </View>
            ) : null}
            {layers.gauges ? (
              <View style={s.legendRow}>
                <View style={[s.gauge, { width: 16, height: 16, borderColor: c.accent, backgroundColor: c.accent }]} />
                <Txt variant="footnote" tone="ink">River gauge (filled = has a flood stage)</Txt>
              </View>
            ) : null}
            {layers.reports ? (
              <View style={s.legendRow}>
                <View style={[s.reportDot, { width: 16, height: 16, backgroundColor: c.levels[1].bg, borderColor: c.levels[1].fg }]} />
                <Txt variant="footnote" tone="ink">Community report (unverified)</Txt>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** A comparison bar: here vs. the SC-5 average, growing in. */
function CompareRow({ label, here, avg }: { label: string; here: number | null; avg: number }) {
  const { c } = useTheme();
  const max = Math.max(here ?? 0, avg, 1);
  return (
    <View style={{ gap: 4, marginBottom: space.m }} accessible accessibilityLabel={`${label}: ${here === null ? 'unknown' : `${here.toFixed(1)} percent`}, SC-5 average ${avg.toFixed(1)} percent`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="callout">{label}</Txt>
        <Txt variant="callout" style={{ fontVariant: ['tabular-nums'] }}>{here === null ? '—' : `${here.toFixed(1)}%`}</Txt>
      </View>
      <View style={[s.bar, { backgroundColor: c.surfaceSunken }]}>
        {here !== null ? <Animated.View entering={FadeIn.duration(300)} style={{ width: `${(here / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: c.accent }} /> : null}
        <View style={[s.avgMark, { left: `${(avg / max) * 100}%`, backgroundColor: c.ink }]} />
      </View>
      <Txt variant="footnote">{`SC-5 average ${avg.toFixed(1)}% (black mark)`}</Txt>
    </View>
  );
}

type LayerState = { alerts: boolean; gauges: boolean; reports: boolean };

function SheetBody({ selection, data, layers, onLayers, score, onScore, onFly }: { selection: NonNullable<Selection>; data: MapData; layers: LayerState; onLayers: (l: LayerState) => void; score: ScoreLayer; onScore: (s: ScoreLayer) => void; onFly: (fips: string) => void }) {
  const { c } = useTheme();
  if (selection.kind === 'layers') {
    const row = (key: keyof LayerState, title: string, detail: string, last = false) => (
      <View style={[s.layerRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline }]}>
        <View style={{ flex: 1 }}>
          <Txt variant="headline">{title}</Txt>
          <Txt variant="footnote">{detail}</Txt>
        </View>
        <Switch
          value={layers[key]}
          onValueChange={(v) => {
            haptic.select();
            onLayers({ ...layers, [key]: v });
          }}
          trackColor={{ true: c.accent, false: c.hairline }}
          accessibilityLabel={title}
        />
      </View>
    );
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {row('alerts', 'Official alert areas', 'Outlined in the alert level’s color')}
        {row('gauges', 'River gauges', 'Gauges without a flood stage appear when you zoom in')}
        {row('reports', 'Community reports', 'Unverified', true)}
        <Txt variant="headline" style={{ marginTop: space.l, marginBottom: space.s }}>
          Color neighborhoods by
        </Txt>
        <SegmentedControl
          label="Color neighborhoods by"
          value={score ?? 'none'}
          onChange={(v) => onScore(v === 'none' ? null : (v as ScoreLayer))}
          options={[
            { value: 'none', label: 'None' },
            { value: 'vulnerability_score', label: 'Vulnerable' },
            { value: 'exposure_score', label: 'Flood' },
            { value: 'priority_score', label: 'Priority' },
          ]}
        />
        <Txt variant="footnote" style={{ marginTop: space.s }}>
          {score ? SCORE_HELP[score] : 'Neighborhood colors are off, so the map stays easy to read. Choose one to compare Census tracts.'}
        </Txt>
      </ScrollView>
    );
  }
  const all = data.tracts.features.map((f) => f.properties);
  if (selection.kind === 'tract') {
    const t = selection.tract;
    const score = (label: string, v: number | null) => (
      <View style={{ flex: 1 }}>
        <Txt variant="footnote">{label}</Txt>
        <Txt variant="numberL">{v === null ? '—' : String(v)}</Txt>
        <Txt variant="footnote">{scoreBand(v)}</Txt>
      </View>
    );
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <Txt variant="callout" tone="muted">{`${countyName(t.county_fips)} County · about ${t.population.toLocaleString()} people`}</Txt>
        {t.data_quality !== 'ok' ? (
          <Txt variant="callout" style={{ marginTop: space.m }}>Insufficient data: too few people or households here (for example a college dorm or a prison) for the percentages to mean much.</Txt>
        ) : (
          <View style={{ flexDirection: 'row', gap: space.m, marginVertical: space.l }}>
            {score('Vulnerability', t.vulnerability_score)}
            {score('Flood exposure', t.exposure_score)}
            {score('Priority', t.priority_score)}
          </View>
        )}
        <CompareRow label="Age 65 and older" here={t.pct_65plus} avg={districtAverage(all, 'pct_65plus')} />
        <CompareRow label="Households without a car" here={t.pct_no_vehicle} avg={districtAverage(all, 'pct_no_vehicle', 'households')} />
        <CompareRow label="Below the poverty line" here={t.pct_poverty} avg={districtAverage(all, 'pct_poverty')} />
        <CompareRow label="With a disability" here={t.pct_disability} avg={districtAverage(all, 'pct_disability')} />
        <CompareRow label="Land in FEMA’s high-risk flood zone" here={t.pct_sfha} avg={districtAverage(all, 'pct_sfha')} />
        <Txt variant="footnote">Scores compare this neighborhood with the other SC-5 tracts (higher = more than most). Census ACS 2020–2024 estimates have margins of error, especially in small areas.</Txt>
      </ScrollView>
    );
  }
  if (selection.kind === 'gauge') {
    const g = selection.gauge;
    const cat = g.flood_category ? CATEGORY[g.flood_category] : null;
    return (
      <View style={{ gap: space.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <Txt variant="numberL">{g.latest ? feet(g.latest.value) : '—'}</Txt>
          {cat ? <StatusBadge level={cat.level} size="s" /> : null}
        </View>
        <Txt variant="callout" tone="muted">{stageSentence(g) ?? (g.has_official_stage ? 'No reading in the last 6 hours.' : 'No official flood stage: shown for context only.')}</Txt>
        <Txt variant="footnote">{`${countyName(g.county_fips)} County${g.latest ? ` · read ${clockTime(g.latest.time)} (${relativeTime(g.latest.time)})` : ''} · provisional USGS data`}</Txt>
        <Button label="Open gauge details" icon="Gauge" onPress={() => router.push({ pathname: '/gauge/[id]', params: { id: g.site_id } })} />
      </View>
    );
  }
  if (selection.kind === 'alert') {
    const a = selection.alert;
    const { hazard, level } = classifyAlert(a);
    return (
      <View style={{ gap: space.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <StatusBadge level={level} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
            <Icon name={HAZARDS[hazard].icon} size={18} tint={c.inkMuted} />
            <Txt variant="callout" tone="muted">{HAZARDS[hazard].label}</Txt>
          </View>
        </View>
        <Txt variant="callout">{a.headline}</Txt>
        <Txt variant="footnote">{`${LEVELS[level].meaning}${a.ends ? ` Until ${clockTime(a.ends)}.` : ''}`}</Txt>
        <Button label="Read the official alert" icon="ExternalLink" onPress={() => router.push({ pathname: '/alert/[id]', params: { id: a.id } })} />
      </View>
    );
  }
  if (selection.kind === 'report') {
    const r = selection.report;
    return (
      <View style={{ gap: space.m }}>
        <Txt variant="callout">{r.description ?? 'No note added.'}</Txt>
        <Txt variant="footnote">{`${countyName(r.county_fips)} County · reported ${relativeTime(r.created_at)}${r.confirm_count ? ` · ${r.confirm_count} said it’s still there` : ''}`}</Txt>
        <Txt variant="footnote">Community reports are unverified and are not sent to any agency.</Txt>
      </View>
    );
  }
  if (selection.kind === 'places') {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {COUNTIES.map((k, i) => (
          <ListRow key={k.fips} title={`${k.name} County`} subtitle={`County seat: ${k.seat.name}`} onPress={() => onFly(k.fips)} last={i === COUNTIES.length - 1} />
        ))}
      </ScrollView>
    );
  }
  // List view: the same information as an accessible list.
  const gauges = data.c.gauges instanceof Error ? [] : data.c.gauges.data;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
      <Txt variant="footnote" style={{ marginBottom: space.s }}>Status from official alerts and river gauges (the map leaves out the rain forecast; see Status for the full picture).</Txt>
      {COUNTIES.map((k, i) => {
        const st = data.countyStatus[k.fips];
        const raised = gauges.filter((g) => g.county_fips === k.fips && g.flood_category).length;
        return (
          <ListRow
            key={k.fips}
            title={`${k.name} County`}
            subtitle={st.active.length ? st.active.map((h) => HAZARDS[h.hazard].label).join(', ') + (raised ? ` · ${raised} gauge${raised > 1 ? 's' : ''} at action stage or higher` : '') : 'No active alerts'}
            trailing={<StatusBadge level={st.level} size="s" />}
            onPress={() => onFly(k.fips)}
            last={i === COUNTIES.length - 1}
          />
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SCREEN_PAD, paddingTop: space.s },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: 44, paddingHorizontal: space.l, borderRadius: radius.pill },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  legendWrap: { position: 'absolute', left: SCREEN_PAD },
  legend: { padding: space.m, borderRadius: radius.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  swatch: { width: 16, height: 12, borderRadius: 3 },
  gauge: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  gaugeCore: { width: 6, height: 6, borderRadius: 3 },
  reportDot: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 8, borderRadius: 4, overflow: 'visible' },
  avgMark: { position: 'absolute', top: -3, width: 2, height: 14, borderRadius: 1 },
});
