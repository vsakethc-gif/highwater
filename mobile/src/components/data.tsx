/**
 * data.tsx — the live data under the status card: official alerts, river gauges, the rain
 * forecast, and facts about who lives in the county. Same wording and rules as the website.
 *
 * The app's signature element is the WATER LEVEL: each gauge with official flood stages shows
 * a small tube whose water rises to the current height, with tick marks at flood stage.
 * The sparkline (a tiny line chart of the last few hours) draws itself in from left to right.
 */
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { THRESHOLDS } from '../../../shared/config';
import type { Alert, FloodCategory, Gauge, Loaded, Trend } from '../../../shared/data/types';
import type { RainForecast } from '../../../shared/hazards/types';
import { feet, gaugeName } from '../../../shared/format';
import { sparklinePoints } from '../../../shared/sparkline';
import { clockTime, dateTime, isStale, relativeTime } from '../../../shared/time';
import { duration, easing, fadeIn, font, listItemEntering, radius, space, text, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

export const OFFICIAL_ALERTS_PAGE = 'https://www.weather.gov/alerts';

// ---------- Alerts ----------
export function AlertRow({ a, index }: { a: Alert; index: number }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const threat = Object.values(a.damage_threat)[0];
  return (
    <Animated.View entering={listItemEntering(index)} style={[s.row, { borderBottomColor: c.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[1], flexWrap: 'wrap' }}>
        <Icon name="CircleAlert" />
        <Txt variant="subheading">{a.event}</Txt>
        {threat ? <Chip label={`Damage threat: ${threat.toLowerCase()}`} level={3} /> : null}
      </View>
      <Txt style={{ marginTop: space[0] }}>{a.headline}</Txt>
      <Txt variant="meta">
        {a.onset ? `From ${dateTime(a.onset)}` : `Issued ${dateTime(a.sent)}`}
        {a.ends ? ` until ${dateTime(a.ends)}` : ''}
      </Txt>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Txt style={[s.link, { color: c.accent }]}>{open ? 'Hide the official alert text' : 'Read the official alert text'}</Txt>
      </Pressable>
      {open ? (
        <Animated.View entering={fadeIn} style={{ gap: space[1] }}>
          <Txt>{a.description}</Txt>
          {a.instruction ? (
            <Txt>
              <Txt style={{ fontFamily: font.bold }}>What NWS says to do: </Txt>
              {a.instruction}
            </Txt>
          ) : null}
          <Txt style={[s.link, { color: c.accent }]} accessibilityRole="link" onPress={() => Linking.openURL(OFFICIAL_ALERTS_PAGE)}>
            All official alerts on weather.gov
          </Txt>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// ---------- Gauges ----------
const TREND: Record<Trend, { label: string; icon: IconName | null }> = {
  rising: { label: 'Rising', icon: 'TrendingUp' },
  falling: { label: 'Falling', icon: 'TrendingDown' },
  steady: { label: 'Steady', icon: 'ArrowRight' },
  unknown: { label: 'Trend unknown', icon: null },
};

/** Flood categories reuse the status colors, matching the flood rules. */
const CATEGORY: Record<FloodCategory, { label: string; level: 1 | 2 | 3 }> = {
  action: { label: 'Action stage', level: 1 },
  minor: { label: 'Minor flooding', level: 2 },
  moderate: { label: 'Moderate flooding', level: 3 },
  major: { label: 'Major flooding', level: 3 },
};

function Chip({ label, level }: { label: string; level?: 1 | 2 | 3 }) {
  const { c } = useTheme();
  const st = level ? c.levels[level] : null;
  return (
    <View style={[s.chip, { borderColor: st ? st.border : c.borderStrong, backgroundColor: st ? st.bg : c.surface }]}>
      <Txt style={{ fontSize: text.sm, fontFamily: font.medium, color: st ? st.fg : c.ink }}>{label}</Txt>
    </View>
  );
}

/** Specific, human wording: "2.1 ft below flood stage and falling". */
export function stageSentence(g: Gauge): string | null {
  if (!g.latest || !g.stages || g.stages.minor === null) return null;
  const diff = Math.abs(g.stages.minor - g.latest.value).toFixed(1);
  const where = g.latest.value >= g.stages.minor ? 'above' : 'below';
  const trend = g.trend === 'unknown' ? '' : ` and ${g.trend}`;
  return `${diff} ft ${where} flood stage${trend}`;
}

/** The water tube: water rises to the current height; marks show action and flood stage. */
const TUBE_W = 22;
const TUBE_H = 56;
function WaterTube({ g }: { g: Gauge }) {
  const { c } = useTheme();
  const stages = g.stages;
  const value = g.latest?.value;
  const rise = useSharedValue(0);
  // Top of the tube: the major flood stage (or a bit above flood stage if no major stage is set).
  const top = stages ? (stages.major ?? stages.moderate ?? (stages.minor ?? 1) * 1.4) : 1;
  const level = value === undefined ? 0 : Math.max(0.03, Math.min(1, value / top));
  useEffect(() => {
    rise.value = withDelay(120, withTiming(level, { duration: duration.slow * 2, easing: easing.out }));
  }, [level, rise]);
  const water = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - rise.value) * TUBE_H }] }));
  if (!stages || value === undefined) return null;
  const fill = g.flood_category ? c.levels[CATEGORY[g.flood_category].level].border : c.accent;
  const mark = (stage: number | null) => (stage === null ? null : TUBE_H - Math.min(1, stage / top) * TUBE_H);
  const minorY = mark(stages.minor);
  const actionY = mark(stages.action);
  return (
    <View style={[s.tube, { borderColor: c.borderStrong, backgroundColor: c.sunken }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, water]}>
        {/* a gentle wave on the water's surface */}
        <Svg width={TUBE_W} height={6} style={{ position: 'absolute', top: -5 }}>
          <Path d={`M0 5 Q ${TUBE_W / 4} 1 ${TUBE_W / 2} 4 T ${TUBE_W} 3 V 6 H 0 Z`} fill={fill} opacity={0.9} />
        </Svg>
        <View style={{ flex: 1, backgroundColor: fill, opacity: 0.9 }} />
      </Animated.View>
      <Svg width={TUBE_W} height={TUBE_H} style={StyleSheet.absoluteFill}>
        {actionY !== null ? <Line x1={0} x2={TUBE_W} y1={actionY} y2={actionY} stroke={c.levels[1].border} strokeWidth={1.5} strokeDasharray="3 2" /> : null}
        {minorY !== null ? <Line x1={0} x2={TUBE_W} y1={minorY} y2={minorY} stroke={c.levels[2].border} strokeWidth={2} /> : null}
      </Svg>
    </View>
  );
}

/** The recent water height as a small line that draws itself in, left to right. Decorative: the number says it. */
function Sparkline({ series }: { series: Gauge['recent_series'] }) {
  const { c } = useTheme();
  const W = 96;
  const H = 28;
  const points = sparklinePoints(series, W, H);
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withDelay(150, withTiming(1, { duration: 800, easing: easing.out }));
  }, [reveal]);
  const clip = useAnimatedStyle(() => ({ transform: [{ translateX: (reveal.value - 1) * (W + 4) }] }));
  const unclip = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - reveal.value) * (W + 4) }] }));
  if (!points) return <View style={{ width: W, height: H }} />;
  const last = points.split(' ').pop()!.split(',');
  return (
    // The outer box slides right while the drawing slides left by the same amount: the line appears to draw itself.
    <View style={{ width: W + 4, height: H, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ width: W + 4, height: H, overflow: 'hidden' }, clip]}>
        <Animated.View style={unclip}>
          <Svg width={W + 4} height={H}>
            <Polyline points={points} fill="none" stroke={c.accent} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={Number(last[0])} cy={Number(last[1])} r={2.5} fill={c.accent} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function floodChip(g: Gauge) {
  if (!g.has_official_stage) return <Chip label="No official flood stage" />;
  if (!g.latest) return <Chip label="No recent reading" />;
  if (!g.flood_category) return <Chip label="Below flood stage" />;
  const cat = CATEGORY[g.flood_category];
  return <Chip label={cat.label} level={cat.level} />;
}

export function GaugeRow({ g, index }: { g: Gauge; index: number }) {
  const { c } = useTheme();
  const trend = TREND[g.trend];
  const stale = g.latest ? isStale(g.latest.time) : false;
  const sentence = stageSentence(g);
  return (
    <Animated.View
      entering={listItemEntering(index)}
      style={[s.row, { borderBottomColor: c.border }]}
      accessible
      accessibilityLabel={`${gaugeName(g.name)}. ${g.latest ? `${feet(g.latest.value)}, ${trend.label}` : 'No recent reading'}. ${sentence ?? (g.has_official_stage ? '' : 'No official flood stage.')}`}
    >
      <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-start' }}>
        <WaterTube g={g} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="subheading">{gaugeName(g.name)}</Txt>
          {sentence ? <Txt style={{ color: c.inkMuted }}>{sentence}</Txt> : null}
          <Txt variant="meta">{g.latest ? `Read at ${clockTime(g.latest.time)} (${relativeTime(g.latest.time)})` : `USGS ${g.site_id}`}</Txt>
          {stale ? (
            <View style={{ flexDirection: 'row', gap: space[0], alignItems: 'center' }}>
              <Icon name="Clock" size={14} />
              <Txt variant="meta">Old reading. This gauge may be offline.</Txt>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {g.latest ? (
            <>
              <Txt style={s.value}>{feet(g.latest.value)}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                {trend.icon ? <Icon name={trend.icon} size={14} tint={c.inkMuted} /> : null}
                <Txt variant="meta">{trend.label}</Txt>
              </View>
            </>
          ) : (
            <Txt variant="meta" style={{ maxWidth: 110, textAlign: 'right' }}>
              No reading in the last 6 hours
            </Txt>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space[1] }}>
        <Sparkline series={g.recent_series} />
        {floodChip(g)}
      </View>
    </Animated.View>
  );
}

// ---------- Rain ----------
export function RainCard({ rain, where }: { rain: Loaded<RainForecast>; where: string }) {
  const { c } = useTheme();
  const stat = (label: string, inches: number) => (
    <View style={{ flex: 1 }} accessible accessibilityLabel={`${label}: ${inches.toFixed(2)} inches`}>
      <Txt variant="meta">{label}</Txt>
      <Txt style={s.big}>
        {inches.toFixed(2)}
        <Txt style={{ fontSize: text.md, color: c.inkMuted }}> in</Txt>
      </Txt>
    </View>
  );
  return (
    <View style={{ gap: space[1] }}>
      <View style={{ flexDirection: 'row', gap: space[3] }}>
        {stat('Next 24 hours', rain.data.next24h_in)}
        {stat('Next 48 hours', rain.data.next48h_in)}
      </View>
      <Txt variant="meta">
        Forecast for {where} · Source: {rain.source} · Issued {dateTime(rain.data.updated_at)}. {THRESHOLDS.rainWatchInches24h} inches or more in 24 hours raises flooding to Watch.
      </Txt>
    </View>
  );
}

// ---------- People in the county ----------
export function FactsTable({ rows, title }: { rows: { label: string; here: number | null; avg: number }[]; title: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space[1] }}>
      <Txt variant="meta">{title}</Txt>
      <View style={[s.tr, { borderBottomColor: c.borderStrong }]}>
        <Txt variant="meta" style={{ flex: 1 }}>
          Measure
        </Txt>
        <Txt variant="meta" style={s.num}>
          Here
        </Txt>
        <Txt variant="meta" style={s.num}>
          SC-5 avg.
        </Txt>
      </View>
      {rows.map((r) => (
        <View
          key={r.label}
          style={[s.tr, { borderBottomColor: c.border }]}
          accessible
          accessibilityLabel={`${r.label}: ${r.here === null ? 'unknown' : `${r.here.toFixed(1)} percent`} here, ${r.avg.toFixed(1)} percent across SC-5`}
        >
          <Txt variant="label" style={{ flex: 1 }}>
            {r.label}
          </Txt>
          <Txt style={s.num}>{r.here === null ? '—' : `${r.here.toFixed(1)}%`}</Txt>
          <Txt style={s.num}>{`${r.avg.toFixed(1)}%`}</Txt>
        </View>
      ))}
      <Txt variant="meta">Census ACS 2020–2024 estimates. Small areas have margins of error.</Txt>
    </View>
  );
}

export function SourceLine({ loaded, extra }: { loaded: Loaded<unknown>; extra?: string }) {
  return (
    <Txt variant="meta" style={{ marginTop: space[1] }}>
      Checked {clockTime(loaded.fetched_at)} · Source: {loaded.source}
      {extra ? ` · ${extra}` : ''}
    </Txt>
  );
}

const s = StyleSheet.create({
  row: { paddingVertical: space[2], borderBottomWidth: 1 },
  chip: { paddingHorizontal: space[1], paddingVertical: 2, borderWidth: 1, borderRadius: radius.sm },
  value: { fontFamily: font.semibold, fontSize: text.xl, fontVariant: ['tabular-nums'] },
  big: { fontFamily: font.semibold, fontSize: text.xxl, fontVariant: ['tabular-nums'] },
  link: { textDecorationLine: 'underline', fontFamily: font.medium },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[1], borderBottomWidth: 1 },
  num: { width: 76, textAlign: 'right', fontVariant: ['tabular-nums'] },
  tube: { width: TUBE_W, height: TUBE_H, borderWidth: 1, borderRadius: TUBE_W / 2, overflow: 'hidden', marginTop: 2 },
});
