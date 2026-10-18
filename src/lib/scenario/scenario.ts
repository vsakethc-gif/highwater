/**
 * scenario.ts — Scenario Mode (brief 12.8): clearly labeled SIMULATIONS for demos.
 *
 * Each scenario is a small JSON file in ./scenarios with fake alerts, gauge readings,
 * and a rain forecast. They are turned into the same shapes as live data and run
 * through the same engine, so the demo shows exactly how the real rules respond.
 * Times are relative to "now" so a scenario always looks current.
 * Nothing from Scenario Mode is ever sent anywhere or saved.
 */
import type { Alert, Gauge, GaugeSite, Reading } from '../data/types';
import { buildGauge } from '../data/usgs';
import type { RainForecast } from '../hazards/types';
import floodWarning from './scenarios/york-flood-warning.json';
import flashFlood from './scenarios/york-flash-flood-emergency.json';
import floodWatch from './scenarios/york-flood-watch.json';
import tornado from './scenarios/lancaster-tornado-warning.json';
import heat from './scenarios/cherokee-extreme-heat.json';
import tropical from './scenarios/kershaw-tropical-storm.json';

interface ScenarioAlert {
  event: string;
  headline: string;
  description: string;
  instruction: string;
  county_fips: string[];
  damage_threat?: Record<string, string>;
  polygon?: number[][];
  startOffsetMin: number;
  endOffsetMin: number;
}

export interface ScenarioFile {
  id: string;
  title: string;
  summary: string;
  county: string;
  alerts: ScenarioAlert[];
  /** USGS site id → water rises (or falls) in a straight line from `from` to `to` over 6 hours. */
  gauges: Record<string, { from: number; to: number }>;
  rain: { next24h_in: number; next48h_in: number };
}

export const SCENARIOS: ScenarioFile[] = [floodWatch, floodWarning, flashFlood, tornado, heat, tropical] as ScenarioFile[];

export function findScenario(id: string | null): ScenarioFile | null {
  return SCENARIOS.find((s) => s.id === id) ?? null;
}

const minutes = (now: number, offset: number) => new Date(now + offset * 60_000).toISOString();

export function scenarioAlerts(s: ScenarioFile, now: number): Alert[] {
  return s.alerts.map((a, i) => ({
    id: `simulated-${s.id}-${i}`,
    event: a.event,
    severity: 'Severe',
    urgency: 'Immediate',
    certainty: 'Likely',
    headline: a.headline,
    description: a.description,
    instruction: a.instruction,
    sent: minutes(now, Math.min(a.startOffsetMin, 0)),
    onset: minutes(now, a.startOffsetMin),
    ends: minutes(now, a.endOffsetMin),
    county_fips: a.county_fips,
    geometry: a.polygon ? { type: 'Polygon', coordinates: [a.polygon] } : null,
    url: 'https://www.weather.gov/alerts',
    action: 'NEW',
    damage_threat: a.damage_threat ?? {},
  }));
}

/** 25 readings, 15 minutes apart, from `from` to `to`. */
function ramp(from: number, to: number, now: number): Reading[] {
  const steps = 24;
  return Array.from({ length: steps + 1 }, (_, i) => ({
    time: new Date(now - (steps - i) * 15 * 60_000).toISOString(),
    value: Math.round((from + ((to - from) * i) / steps) * 100) / 100,
  }));
}

/**
 * Simulated gauges: listed sites follow their scenario ramp; every other gauge
 * gets a steady, ordinary level (35% of its action stage, or 2 ft with no stage).
 */
export function scenarioGauges(s: ScenarioFile, sites: GaugeSite[], now: number): Gauge[] {
  return sites.map((site) => {
    const plan = s.gauges[site.site_id];
    const normal = site.stages?.action ? Math.round(site.stages.action * 0.35 * 100) / 100 : 2;
    const series = plan ? ramp(plan.from, plan.to, now) : ramp(normal, normal, now);
    return buildGauge(site, series);
  });
}

export function scenarioRain(s: ScenarioFile, now: number): RainForecast {
  return { ...s.rain, updated_at: new Date(now).toISOString() };
}
