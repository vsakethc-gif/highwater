/**
 * score.ts — comparing routes with a transparent formula (brief 10.2).
 *
 *   score = travel minutes
 *         + 30 for each active warning area the route passes through
 *         + 3  for each FEMA high-risk flood zone it crosses
 *
 * Lower is better. Why these weights: passing through an active warning is the thing
 * we most want to avoid, so it "costs" as much as half an hour of extra driving.
 * Flood-zone crossings are long-term risk (most creek crossings are in one), so each
 * costs a few minutes. The numbers are a judgment call, and they're shown on each card.
 */
import { pointInGeometry } from '../geo';

export const ALERT_AREA_PENALTY_MIN = 30;
export const FLOOD_ZONE_PENALTY_MIN = 3;

export interface ScoredRoute {
  duration_s: number;
  alert_area_intersections: number;
  /** null when FEMA couldn't be reached to count them. */
  flood_zone_crossings: number | null;
}

export function routeScore(r: ScoredRoute): number {
  return r.duration_s / 60 + ALERT_AREA_PENALTY_MIN * r.alert_area_intersections + FLOOD_ZONE_PENALTY_MIN * (r.flood_zone_crossings ?? 0);
}

/** How many of these areas does the route line pass through? (Checks every point of the route line.) */
export function countAreasCrossed(line: number[][], areas: GeoJSON.Geometry[]): number {
  return areas.filter((area) => line.some(([lon, lat]) => pointInGeometry(lon, lat, area))).length;
}

/** "28 min", "1 hr 5 min" */
export function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} hr ${min % 60} min`;
}

/** Meters to miles, one decimal. */
export function formatMiles(meters: number): string {
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

/**
 * Keep at most `max` points of a line (always keeping the ends), so it fits in a
 * web request when we ask FEMA which flood zones it crosses.
 */
export function thinLine(line: number[][], max = 250): number[][] {
  if (line.length <= max) return line;
  const step = (line.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => line[Math.round(i * step)]);
}
