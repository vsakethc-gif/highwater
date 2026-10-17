/**
 * config.ts — the one place for settings that might change.
 *
 * If you want to rename the app, switch a feature off, or adjust a threshold,
 * change it here. Every other file reads from this file instead of
 * hard-coding its own copy.
 */

/** The app's display name. Placeholder: change it here and it changes everywhere. */
export const APP_NAME = 'SC-5 Ready';

/** One-sentence description used in page titles and the social preview. */
export const APP_TAGLINE =
  'Live hazard information, plain-language guidance, and community reports for South Carolina’s 5th District.';

/** A county in SC-5. `fips` is the 5-digit Census code: 45 (South Carolina) + 3-digit county code. */
export interface County {
  fips: string;
  name: string;
}

/**
 * The 8 counties fully inside SC-5.
 * NOTE: these FIPS codes still need to be checked against Census data in Phase 1.
 * Spartanburg (45083) and Sumter (45085) are only partly in SC-5, so they are a stretch goal.
 */
export const COUNTIES: readonly County[] = [
  { fips: '45021', name: 'Cherokee' },
  { fips: '45023', name: 'Chester' },
  { fips: '45039', name: 'Fairfield' },
  { fips: '45055', name: 'Kershaw' },
  { fips: '45057', name: 'Lancaster' },
  { fips: '45061', name: 'Lee' },
  { fips: '45087', name: 'Union' },
  { fips: '45091', name: 'York' },
];

/** The county shown first, before the person chooses their own. */
export const DEFAULT_COUNTY_FIPS = '45091'; // York

/**
 * Feature flags. Setting one to `false` hides that feature completely,
 * so an unfinished feature can never break the core app.
 * P0 features (flood status, map, scenario mode) are always on and have no flag.
 */
export const FEATURES = {
  multiHazard: false, // P1a: all NWS alert types, not just flooding
  offline: false, // P1a: installable app that works with weak signal
  routePlanner: false, // P1b: lower-exposure route map + shelters
  reports: false, // P1c: community issue reporting
  airQuality: false, // P2
  earthquakes: false, // P2
  wildfire: false, // P2
} as const;

/** Numbers the hazard engine uses. Each one is explained in METHODOLOGY.md. */
export const THRESHOLDS = {
  /** Forecast rain (inches in the next 24 hours) that raises flood status to Watch. */
  rainWatchInches24h: 2,
  /** Live data older than this is labeled stale and never shown as an "all clear". */
  staleAfterMinutes: 120,
} as const;

/** Text that must appear at the end of every guidance block (brief, section 9). */
export const DISCLAIMER =
  'This app is not an official warning system. Follow instructions from local officials. In an emergency, call 911.';
