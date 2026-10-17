/**
 * gauges.ts — loads the static gauge list (made by scripts/build-gauges.mjs).
 * Live readings are added in conditions.ts.
 */
import type { GaugeSite } from './types';

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

