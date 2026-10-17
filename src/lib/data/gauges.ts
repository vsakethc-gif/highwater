/**
 * gauges.ts — loads the static gauge list (made by scripts/build-gauges.mjs)
 * and combines it with live USGS readings.
 */
import type { Gauge, GaugeSite, Loaded } from './types';
import { buildGauge, fetchGaugeReadings } from './usgs';

interface GaugeFile {
  generated_at: string;
  gauges: GaugeSite[];
}

let siteList: Promise<GaugeSite[]> | null = null;

/** The gauge list is loaded once and reused (it doesn't change while the app is open). */
export function loadGaugeSites(): Promise<GaugeSite[]> {
  siteList ??= fetch(`${import.meta.env.BASE_URL}data/gauges.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`Gauge list returned ${res.status}`);
      return res.json() as Promise<GaugeSite[] | GaugeFile>;
    })
    .then((file) => (Array.isArray(file) ? file : file.gauges))
    .catch((err) => {
      siteList = null; // allow a retry later
      throw err;
    });
  return siteList;
}

/** Live gauges for one county. Gauges that sent no reading in 6 hours are kept, with latest = null. */
export async function loadCountyGauges(fips: string, signal?: AbortSignal): Promise<Loaded<Gauge[]>> {
  const sites = (await loadGaugeSites()).filter((s) => s.county_fips === fips);
  if (sites.length === 0) return { data: [], fetched_at: new Date().toISOString(), source: 'USGS' };
  const { readings, source } = await fetchGaugeReadings(
    sites.map((s) => s.site_id),
    signal,
  );
  const gauges = sites.map((s) => buildGauge(s, readings.get(s.site_id) ?? []));
  return { data: gauges, fetched_at: new Date().toISOString(), source };
}
