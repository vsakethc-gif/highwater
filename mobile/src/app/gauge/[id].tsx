/**
 * gauge/[id].tsx — one river gauge up close (brief section 8.3): the big water fill with its
 * labeled flood stages, the current reading, a chart of recent readings, and what it means.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { Gauge } from '../../../../shared/data/types';
import { feet, gaugeName } from '../../../../shared/format';
import { countyName } from '../../../../shared/places';
import { clockTime, dateTime, relativeTime } from '../../../../shared/time';
import { Sparkline, WaterFill } from '../../components/data/Charts';
import { CATEGORY, TREND, stageSentence } from '../../components/data/Rows';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Chips';
import { EmptyState } from '../../components/ui/Feedback';
import { Card, SectionHeader } from '../../components/ui/Layout';
import { Screen } from '../../components/ui/Screen';
import { Txt } from '../../components/ui/Text';
import { latestStatus } from '../../hooks/useStatus';
import { fadeIn, SCREEN_PAD, space, useTheme } from '../../theme';

function stats(g: Gauge) {
  const series = g.recent_series;
  if (series.length < 2 || !g.latest) return null;
  const first = series[0];
  const change = g.latest.value - first.value;
  const high = Math.max(...series.map((r) => r.value));
  const hours = Math.round((Date.parse(g.latest.time) - Date.parse(first.time)) / 3600_000);
  const next = g.stages ? ([['action', 'action stage'], ['minor', 'flood stage'], ['moderate', 'moderate flood'], ['major', 'major flood']] as const).find(([k]) => g.stages![k] !== null && g.latest!.value < (g.stages![k] as number)) : undefined;
  return { change, high, hours, next: next ? { label: next[1], ft: (g.stages![next[0]] as number) - g.latest.value } : null };
}

export default function GaugeDetail() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = latestStatus();
  const g = data && !(data.c.gauges instanceof Error) ? data.c.gauges.data.find((x) => x.site_id === id) : undefined;

  return (
    <Screen>
      <View style={s.top}>
        <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />
      </View>
      {!g ? (
        <View style={{ padding: SCREEN_PAD }}>
          <EmptyState title="This gauge isn’t loaded right now." detail="Go back to Status and pull down to refresh." action="Back to Status" onAction={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PAD, paddingBottom: 140 }}>
          <Detail g={g} source={data && !(data.c.gauges instanceof Error) ? data.c.gauges.source : 'USGS'} />
        </ScrollView>
      )}
    </Screen>
  );
}

function Detail({ g, source }: { g: Gauge; source: string }) {
  const { c } = useTheme();
  const trend = TREND[g.trend];
  const st = stats(g);
  const sentence = stageSentence(g);
  const cat = g.flood_category ? CATEGORY[g.flood_category] : null;
  return (
    <Animated.View entering={fadeIn}>
      <Txt variant="title2" accessibilityRole="header">
        {gaugeName(g.name)}
      </Txt>
      <Txt variant="footnote" style={{ marginTop: space.xs }}>
        {`${countyName(g.county_fips)} County · Provisional · ${source}${g.latest ? ` · updated ${relativeTime(g.latest.time)}` : ''}`}
      </Txt>

      <Card style={{ marginTop: space.xl, flexDirection: 'row', gap: space.xl, alignItems: 'center' }}>
        {g.stages && g.latest ? <WaterFill gauge={g} width={64} height={168} labels moving /> : null}
        <View style={{ flex: 1, gap: space.xs }}>
          <Txt variant="caption" tone="muted">
            Gage height
          </Txt>
          <Txt variant="numberXL">{g.latest ? feet(g.latest.value) : '—'}</Txt>
          {g.latest ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              {trend.icon ? <Icon name={trend.icon} size={16} tint={c.inkMuted} /> : null}
              <Txt variant="callout" tone="muted">
                {trend.label}
              </Txt>
            </View>
          ) : null}
          {cat ? <StatusBadge level={cat.level} size="s" /> : null}
        </View>
      </Card>

      <View style={{ marginTop: space.x3 }}>
        <SectionHeader title={st ? `Last ${st.hours} hours` : 'Recent readings'} />
        <Card>
          <Sparkline series={g.recent_series} width={300} height={96} reference={g.stages?.minor ?? null} />
          <Txt variant="footnote" style={{ marginTop: space.s }}>
            {g.latest ? `Latest reading ${clockTime(g.latest.time)}${g.stages?.minor != null ? ' · dashed line: flood stage' : ''}` : 'No reading in the last 6 hours.'}
          </Txt>
        </Card>
      </View>

      {st ? (
        <View style={s.stats}>
          <Stat label="Change" value={`${st.change >= 0 ? '+' : ''}${st.change.toFixed(2)} ft`} />
          <Stat label="High" value={feet(st.high)} />
          <Stat label={st.next ? `To ${st.next.label}` : 'Stage'} value={st.next ? `${st.next.ft.toFixed(1)} ft` : g.has_official_stage ? 'Above major' : 'None'} />
        </View>
      ) : null}

      <View style={{ marginTop: space.x3 }}>
        <SectionHeader title="What this means" />
        <Txt>
          {g.has_official_stage
            ? `${sentence ?? 'No recent reading.'} Flood stage is the height where the National Weather Service says flooding begins at this spot. Action stage means it’s time to get ready.`
            : 'This gauge has no official flood stage, so it never changes the status by itself. It’s shown so you can see whether the water is rising or falling here.'}
        </Txt>
        <Txt variant="footnote" style={{ marginTop: space.s }}>
          {`USGS ${g.site_id}${g.latest ? ` · read ${dateTime(g.latest.time)}` : ''}. Provisional data may be revised.`}
        </Txt>
      </View>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: space.m }}>
      <Txt variant="footnote">{label}</Txt>
      <Txt variant="headline" style={{ fontVariant: ['tabular-nums'], marginTop: 2 }}>
        {value}
      </Txt>
    </Card>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: space.s, paddingTop: space.xs, flexDirection: 'row' },
  stats: { flexDirection: 'row', gap: space.s, marginTop: space.m },
});
