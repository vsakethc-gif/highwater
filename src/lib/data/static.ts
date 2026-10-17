/**
 * static.ts — loads the pre-built data files in /public/data (made by the scripts in /scripts).
 * Each file is downloaded once and reused while the app is open.
 */
import { scoreTracts, type Tract, type TractRaw } from '../hazards/vulnerability';

export interface CountyProps {
  fips: string;
  name: string;
}
export type CountyCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, CountyProps>;
export type TractCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, Tract> & {
  metadata?: Record<string, string>;
};
/** ZIP code → [lat, lon, county FIPS] */
export type ZipTable = Record<string, [number, number, string]>;

const cache = new Map<string, Promise<unknown>>();

function load<T>(file: string): Promise<T> {
  let p = cache.get(file) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/${file}`).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${file} (${res.status})`);
      return res.json() as Promise<T>;
    });
    p.catch(() => cache.delete(file)); // allow a retry after a failure
    cache.set(file, p);
  }
  return p;
}

export const loadCounties = () => load<CountyCollection>('counties.geojson');
export const loadZips = () => load<ZipTable>('zips.json');

/** Tracts with vulnerability, exposure, and priority scores computed in the browser. */
export async function loadTracts(): Promise<TractCollection> {
  const raw = await load<GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, TractRaw> & { metadata?: Record<string, string> }>(
    'tracts.geojson',
  );
  const scored = scoreTracts(raw.features.map((f) => f.properties));
  return {
    ...raw,
    features: raw.features.map((f, i) => ({ ...f, properties: scored[i] })),
  };
}
