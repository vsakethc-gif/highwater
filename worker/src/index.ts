/**
 * SC-5 Ready Worker — the app's one small piece of server code (brief, section 2.3).
 *
 * It exists for two reasons:
 *   1. POST /route   — asks OpenRouteService for directions. The ORS key is a Worker
 *                      "secret", so it never reaches anyone's browser.
 *   2. GET /geocode  — address search through the U.S. Census Geocoder, which doesn't
 *                      allow browsers to call it directly (no CORS).
 *
 * Privacy: nothing is stored or logged. Locations pass through to the service that
 * answers them and are then forgotten.
 */
import { orsBody, RateLimiter, validateQuery, validateRoute } from './validate';

export interface Env {
  ORS_API_KEY: string;
  /** Comma-separated list of sites allowed to use this Worker. */
  ALLOWED_ORIGINS: string;
}

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
const GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

// Per-visitor limits. Each route request can use up to 2 ORS calls (fastest + lower-exposure).
const routeLimiter = new RateLimiter(20, 10 * 60_000); // 20 per 10 minutes
const geocodeLimiter = new RateLimiter(60, 10 * 60_000); // 60 per 10 minutes

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {};
}

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
  });
}

/** One-way hash of the visitor's IP, so the rate limiter never holds the IP itself. */
async function visitorId(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return btoa(String.fromCharCode(...new Uint8Array(digest).slice(0, 12)));
}

async function handleRoute(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!routeLimiter.allow(await visitorId(request))) {
    return json({ error: 'Too many route requests. Please wait a few minutes and try again.' }, 429, cors);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400, cors);
  }
  const checked = validateRoute(body);
  if (typeof checked === 'string') return json({ error: checked }, 400, cors);

  // Give up after 20 seconds so the app can switch to its backup instead of hanging.
  let res: Response;
  try {
    res = await fetch(ORS_URL, {
      method: 'POST',
      headers: { Authorization: env.ORS_API_KEY, 'Content-Type': 'application/json', Accept: 'application/geo+json' },
      body: JSON.stringify(orsBody(checked)),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return json({ error: 'The routing service didn’t respond in time.', status: 504 }, 504, cors);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Pass back ORS's reason (e.g. "no route found", quota reached) without exposing the key.
    const message = (data as { error?: { message?: string } }).error?.message ?? `Routing service error ${res.status}`;
    return json({ error: message, status: res.status }, res.status === 429 ? 429 : 502, cors);
  }
  return json(data, 200, cors);
}

async function handleGeocode(request: Request, cors: Record<string, string>): Promise<Response> {
  if (!geocodeLimiter.allow(await visitorId(request))) {
    return json({ error: 'Too many searches. Please wait a few minutes and try again.' }, 429, cors);
  }
  const q = validateQuery(new URL(request.url).searchParams.get('q'));
  if (!q) return json({ error: 'Enter an address.' }, 400, cors);
  const url = `${GEOCODER_URL}?${new URLSearchParams({ address: q, benchmark: 'Public_AR_Current', format: 'json' })}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  } catch {
    return json({ error: 'Address search didn’t respond in time. Try a ZIP code or tap the map.' }, 504, cors);
  }
  if (!res.ok) return json({ error: `Address search error ${res.status}` }, 502, cors);
  const data = (await res.json()) as {
    result?: { addressMatches?: { matchedAddress: string; coordinates: { x: number; y: number } }[] };
  };
  const matches = (data.result?.addressMatches ?? [])
    .slice(0, 5)
    .map((m) => ({ label: m.matchedAddress, lon: m.coordinates.x, lat: m.coordinates.y }));
  return json({ matches }, 200, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);
    // Only this app's own pages may use the Worker.
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'Not allowed.' }, 403, {});
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);
    if (pathname === '/route' && request.method === 'POST') return handleRoute(request, env, cors);
    if (pathname === '/geocode' && request.method === 'GET') return handleGeocode(request, cors);
    return json({ error: 'Not found.' }, 404, cors);
  },
};
