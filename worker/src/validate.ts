/**
 * validate.ts — checks every request before the Worker passes it on.
 *
 * The Worker spends our routing quota, so it only accepts requests that look like
 * real use of this app: points in or near South Carolina, a reasonable number of
 * avoid areas, and short address searches. Pure functions, so they can be tested.
 */

/** Generous box around SC-5 and nearby (destinations like shelters may be outside the district). */
export const AREA = { minLon: -84, maxLon: -78, minLat: 31.5, maxLat: 36.8 };
export const MAX_AVOID_POLYGONS = 30;
export const MAX_AVOID_POINTS = 3000;
export const MAX_QUERY_LENGTH = 120;

export type LonLat = [number, number];

export interface RouteRequest {
  start: LonLat;
  end: LonLat;
  /** Areas to route around, as a GeoJSON MultiPolygon's coordinates. */
  avoid: number[][][][] | null;
  alternatives: boolean;
}

function isPoint(p: unknown): p is LonLat {
  return (
    Array.isArray(p) &&
    p.length === 2 &&
    p.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    p[0] >= AREA.minLon &&
    p[0] <= AREA.maxLon &&
    p[1] >= AREA.minLat &&
    p[1] <= AREA.maxLat
  );
}

/** Returns a clean request, or an error message to send back. */
export function validateRoute(body: unknown): RouteRequest | string {
  if (!body || typeof body !== 'object') return 'Request body must be JSON.';
  const b = body as Record<string, unknown>;
  if (!isPoint(b.start) || !isPoint(b.end)) return 'Start and end must be [longitude, latitude] in or near South Carolina.';

  let avoid: number[][][][] | null = null;
  if (b.avoid !== undefined && b.avoid !== null) {
    if (!Array.isArray(b.avoid)) return 'avoid must be MultiPolygon coordinates.';
    if (b.avoid.length > MAX_AVOID_POLYGONS) return `Too many avoid areas (max ${MAX_AVOID_POLYGONS}).`;
    let points = 0;
    for (const polygon of b.avoid) {
      if (!Array.isArray(polygon) || polygon.length === 0) return 'Each avoid area must be a polygon.';
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4) return 'Each polygon ring needs at least 4 points.';
        for (const p of ring) {
          if (!isPoint(p)) return 'Avoid area points must be in or near South Carolina.';
          points++;
        }
      }
    }
    if (points > MAX_AVOID_POINTS) return `Avoid areas are too detailed (max ${MAX_AVOID_POINTS} points).`;
    avoid = b.avoid as number[][][][];
  }
  return { start: b.start, end: b.end, avoid, alternatives: b.alternatives === true };
}

/** Address search text: trimmed, not empty, not too long. */
export function validateQuery(q: string | null): string | null {
  const text = (q ?? '').trim();
  if (!text || text.length > MAX_QUERY_LENGTH) return null;
  return text;
}

/** The request body sent to OpenRouteService. */
export function orsBody(r: RouteRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    coordinates: [r.start, r.end],
    instructions: true,
    language: 'en',
    units: 'm',
  };
  if (r.avoid?.length) body.options = { avoid_polygons: { type: 'MultiPolygon', coordinates: r.avoid } };
  if (r.alternatives) body.alternative_routes = { target_count: 2, weight_factor: 1.6, share_factor: 0.6 };
  return body;
}

/**
 * Simple rate limit: at most `limit` requests per `windowMs` for each visitor.
 * Visitors are tracked by a one-way hash of their IP address, kept only in memory
 * for the length of the window, never stored or logged.
 * (Each Cloudflare server keeps its own count, so this is a basic guard, not a perfect one.)
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  allow(visitor: string, now = Date.now()): boolean {
    const recent = (this.hits.get(visitor) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(visitor, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(visitor, recent);
    if (this.hits.size > 5000) this.prune(now);
    return true;
  }

  private prune(now: number): void {
    for (const [k, times] of this.hits) if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
  }
}
