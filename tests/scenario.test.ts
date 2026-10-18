import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SCENARIOS, scenarioAlerts, scenarioGauges, scenarioRain, findScenario } from '../src/lib/scenario/scenario';
import { evaluate } from '../src/lib/hazards/engine';
import { guidanceFor, routeAllowed } from '../src/lib/guidance/guidance';
import type { GaugeSite } from '../src/lib/data/types';
import type { HazardId } from '../src/lib/hazards/types';

// The real gauge list the app ships with.
const SITES: GaugeSite[] = JSON.parse(readFileSync('public/data/gauges.json', 'utf8')).gauges;
const NOW = Date.parse('2026-10-17T23:00:00Z');

function run(id: string) {
  const s = findScenario(id)!;
  const status = evaluate(
    { alerts: scenarioAlerts(s, NOW), gauges: scenarioGauges(s, SITES, NOW), rain: scenarioRain(s, NOW), now: NOW },
    { kind: 'county', fips: s.county },
  );
  const ctx = { placeName: 'test', inFloodZone: null, pctNoVehicle: null, vulnerability: null };
  return { status, blocks: status.active.map((a) => guidanceFor(a, ctx)) };
}

describe('Scenario Mode (brief 12.8)', () => {
  it('every scenario gauge exists in the real gauge list', () => {
    for (const s of SCENARIOS) {
      for (const id of Object.keys(s.gauges)) expect(SITES.some((g) => g.site_id === id), `${s.id}: ${id}`).toBe(true);
    }
  });

  it('every simulated alert says SIMULATED in its text', () => {
    for (const s of SCENARIOS) for (const a of s.alerts) expect(a.description).toMatch(/^SIMULATED/);
  });

  it.each([
    ['york-flood-watch', 1, 'flood'],
    ['york-flood-warning', 2, 'flood'],
    ['york-flash-flood-emergency', 3, 'flood'],
    ['lancaster-tornado-warning', 2, 'tornado'],
    ['cherokee-extreme-heat', 2, 'heat'],
    ['kershaw-tropical-storm', 2, 'tropical'],
  ] as [string, number, HazardId][])('%s → level %i, top hazard %s', (id, level, hazard) => {
    const { status } = run(id);
    expect(status.level).toBe(level);
    expect(status.active[0].hazard).toBe(hazard);
    expect(status.complete).toBe(true);
  });

  it('shows all four levels across scenarios plus live Normal, and at least three hazard types', () => {
    const levels = new Set(SCENARIOS.map((s) => run(s.id).status.level));
    expect([...levels].sort()).toEqual([1, 2, 3]);
    expect(new Set(SCENARIOS.map((s) => run(s.id).status.active[0].hazard)).size).toBeGreaterThanOrEqual(3);
  });

  it('the river flood warning comes from both the NWS alert and a gauge in minor flood', () => {
    const texts = run('york-flood-warning').status.active[0].triggers.map((t) => t.text);
    expect(texts).toContain('Flood Warning');
    expect(texts.some((t) => t.startsWith('Catawba River near Rock Hill is in minor flood'))).toBe(true);
  });

  it('tornado scenario: no route button', () => {
    expect(routeAllowed(run('lancaster-tornado-warning').blocks)).toBe(false);
  });

  it('simulated readings end at "now" so they are never treated as stale', () => {
    const s = findScenario('york-flood-warning')!;
    const g = scenarioGauges(s, SITES, NOW).find((x) => x.site_id === '02146000')!;
    expect(g.latest?.time).toBe(new Date(NOW).toISOString());
    expect(g.latest?.value).toBe(16.4);
    expect(g.trend).toBe('rising');
  });
});

describe('multi-hazard scenarios', () => {
  it('tropical storm scenario shows two hazards: tropical first, then flooding (rain + Flood Watch)', () => {
    const { status } = run('kershaw-tropical-storm');
    expect(status.active.map((a) => a.hazard)).toEqual(['tropical', 'flood']);
    expect(status.active[1].level).toBe(1);
  });

  it('heat scenario: shelter in place, no route button, heat stroke advice', () => {
    const { blocks } = run('cherokee-extreme-heat');
    expect(blocks[0].shelterInPlace).toBe(true);
    expect(routeAllowed(blocks)).toBe(false);
    expect(blocks[0].ifWorse.join(' ')).toMatch(/Heat stroke is an emergency/);
  });
});
