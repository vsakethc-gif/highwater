import { describe, it, expect } from 'vitest';
import { guidanceFor, routeAllowed, TURN_AROUND } from '../src/lib/guidance/guidance';
import type { GuidanceContext } from '../src/lib/guidance/types';
import type { HazardId, HazardStatus } from '../src/lib/hazards/types';
import type { Level } from '../src/lib/hazards/levels';

const ctx: GuidanceContext = { placeName: 'York County', inFloodZone: null, pctNoVehicle: 3, vulnerability: 40 };
const status = (hazard: HazardId, level: Level, text = 'Test alert'): HazardStatus => ({
  hazard,
  level,
  triggers: level ? [{ level, text, source: 'test' }] : [],
  updated_at: '',
});

describe('guidance selection (brief 9)', () => {
  it('every flood level includes "Turn around, don’t drown" from Watch up', () => {
    for (const level of [1, 2, 3] as Level[]) {
      expect(guidanceFor(status('flood', level), ctx).doNow.join(' ')).toContain('Turn around, don’t drown');
    }
  });

  it('gives 3 to 6 "do this now" steps for every hazard and level', () => {
    const hazards: HazardId[] = ['flood', 'tornado', 'severe_storm', 'heat', 'wind', 'other'];
    for (const h of hazards) {
      for (const level of [0, 1, 2, 3] as Level[]) {
        if (h !== 'flood' && level === 0) continue;
        const n = guidanceFor(status(h, level), ctx).doNow.length;
        expect(n, `${h} level ${level}`).toBeGreaterThanOrEqual(3);
        expect(n, `${h} level ${level}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('builds "What’s happening" from the actual trigger', () => {
    const g = guidanceFor(status('flood', 2, 'Catawba River near Rock Hill is in minor flood (16.00 ft)'), ctx);
    expect(g.whatsHappening).toContain('Catawba River near Rock Hill is in minor flood');
  });

  it('tornado: shelter in place, NO route button, never suggests driving away', () => {
    const g = guidanceFor(status('tornado', 2, 'Tornado Warning'), ctx);
    expect(g.shelterInPlace).toBe(true);
    expect(g.canRoute).toBe(false);
    expect(g.doNow.join(' ')).toMatch(/interior room on the lowest floor/);
    expect(routeAllowed([g])).toBe(false);
  });

  it('severe storm and extreme heat/cold never offer a route', () => {
    for (const h of ['severe_storm', 'heat', 'cold'] as HazardId[]) {
      expect(guidanceFor(status(h, 2), ctx).canRoute).toBe(false);
    }
  });

  it('flood Warning or Danger can offer a route; Watch cannot', () => {
    expect(guidanceFor(status('flood', 1), ctx).canRoute).toBe(false);
    expect(guidanceFor(status('flood', 2), ctx).canRoute).toBe(true);
  });

  it('a Tornado Warning during a flood blocks the route button (do not drive into a tornado)', () => {
    const blocks = [guidanceFor(status('flood', 2), ctx), guidanceFor(status('tornado', 2), ctx)];
    expect(routeAllowed(blocks)).toBe(false);
  });

  it('in a FEMA flood zone, a flood Watch says to be ready to leave', () => {
    const g = guidanceFor(status('flood', 1), { ...ctx, inFloodZone: true });
    expect(g.doNow.join(' ')).toMatch(/high-risk flood zone/);
  });

  it('many households without a car: adds transportation help and a stronger check-on-others line', () => {
    const g = guidanceFor(status('flood', 2), { ...ctx, pctNoVehicle: 12 });
    expect(g.doNow.join(' ')).toMatch(/don’t have a car/);
    expect(g.checkOnOthers).toMatch(/knock on doors/);
  });

  it('never calls a place or route "safe"', () => {
    const hazards: HazardId[] = ['flood', 'tornado', 'severe_storm', 'tropical', 'heat', 'other'];
    for (const h of hazards) {
      for (const level of [0, 1, 2, 3] as Level[]) {
        const g = guidanceFor(status(h, level), { ...ctx, inFloodZone: true, pctNoVehicle: 20, vulnerability: 90 });
        const all = [g.whatsHappening, ...g.doNow, ...g.ifWorse, g.checkOnOthers].join(' ');
        expect(all, `${h} ${level}`).not.toMatch(/\bsafe(ly|ty)?\b/i);
      }
    }
    expect(TURN_AROUND).not.toMatch(/\bsafe\b/i);
  });

  it('links to official sources', () => {
    for (const link of guidanceFor(status('flood', 2), ctx).links) {
      expect(link.url).toMatch(/^https:\/\/(www\.)?(weather\.gov|ready\.gov|scemd\.org|redcross\.org)\//);
    }
  });
});
