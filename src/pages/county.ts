/**
 * county.ts — live conditions for one county: active NWS alerts and river/stream gauges.
 *
 * Each section loads on its own. If one source fails, the other still shows,
 * and the failed one explains what went wrong (brief 12.9: states everywhere).
 *
 * Phase 2 adds the status card, guidance, the county picker, and the rain forecast.
 */
import { APP_NAME, COUNTIES } from '../config';
import { append, h } from '../lib/dom';
import type { Alert, Gauge, Loaded } from '../lib/data/types';
import { alertsForCounty, fetchActiveAlerts } from '../lib/data/nws';
import { loadCountyGauges } from '../lib/data/gauges';
import { clockTime, relativeTime } from '../lib/time';
import { alertRow } from '../components/alertRow';
import { gaugeRow } from '../components/gaugeRow';
import { icon } from '../components/icon';
import { siteFooter, siteHeader, skipLink } from '../components/layout';

/** Refresh live data every 10 minutes while the page is open (USGS updates about every 15). */
const REFRESH_MS = 10 * 60_000;

function countyName(fips: string): string {
  return COUNTIES.find((c) => c.fips === fips)?.name ?? 'Unknown';
}

/** Gray placeholder rows shown while data loads, so the layout doesn't jump. */
function skeleton(rows: number): HTMLElement {
  return h('ul', { class: 'skeleton-list', 'aria-hidden': 'true' }, ...Array.from({ length: rows }, () => h('li', { class: 'skeleton' })));
}

function sourceLine(loaded: Loaded<unknown>, extra?: string): HTMLElement {
  return h(
    'p',
    { class: 'meta source-line' },
    `Checked ${clockTime(loaded.fetched_at)} · Source: ${loaded.source}`,
    extra && ` · ${extra}`,
  );
}

/** An error message that says what failed, what still works, and offers a retry. */
function errorBox(title: string, detail: string, retry: () => void): HTMLElement {
  const button = h('button', { class: 'button button--secondary', type: 'button' }, 'Try again');
  button.addEventListener('click', retry);
  return h(
    'div',
    { class: 'notice notice--error', role: 'alert' },
    icon('CloudOff'),
    h('div', {}, h('p', { class: 'notice__title' }, title), h('p', {}, detail), button),
  );
}

// ---------- alerts section ----------

function renderAlerts(slot: HTMLElement, county: string, result: Loaded<Alert[]> | Error, retry: () => void): void {
  if (result instanceof Error) {
    slot.replaceChildren(
      errorBox(
          'Couldn’t load alerts from the National Weather Service.',
          'River levels below may still be working. Check official alerts at weather.gov/alerts.',
          retry,
      ),
    );
    return;
  }
  const alerts = result.data;
  slot.replaceChildren(
    alerts.length
      ? h('ul', { class: 'alert-list' }, ...alerts.map(alertRow))
      : h(
          'p',
          { class: 'empty-state' },
          icon('CircleCheck'),
          `No active National Weather Service alerts for ${county} County right now.`,
        ),
    sourceLine(result),
  );
}

// ---------- gauges section ----------

function renderGauges(slot: HTMLElement, county: string, result: Loaded<Gauge[]> | Error, retry: () => void): void {
  if (result instanceof Error) {
    slot.replaceChildren(
      errorBox(
          'Couldn’t load river levels from USGS.',
          'Alerts above may still be working. You can also check waterdata.usgs.gov.',
          retry,
      ),
    );
    return;
  }
  const gauges = result.data;
  if (gauges.length === 0) {
    slot.replaceChildren(
      h('p', { class: 'empty-state' }, icon('Waves'), `There are no active USGS stream gauges in ${county} County.`),
    );
    return;
  }
  // Gauges in flood first, then by name.
  const rank = { major: 4, moderate: 3, minor: 2, action: 1 } as const;
  const sorted = [...gauges].sort(
    (a, b) => (b.flood_category ? rank[b.flood_category] : 0) - (a.flood_category ? rank[a.flood_category] : 0) || a.name.localeCompare(b.name),
  );
  slot.replaceChildren(
    h('ul', { class: 'gauge-list' }, ...sorted.map(gaugeRow)),
    sourceLine(result, 'Provisional data: USGS may revise these readings.'),
  );
}

// ---------- page ----------

export function renderCounty(root: HTMLElement, fips: string): void {
  const county = countyName(fips);
  document.title = `${county} County · ${APP_NAME}`;

  const alertsSlot = h('div', { 'aria-live': 'polite', 'aria-busy': 'true' }, skeleton(2));
  const gaugesSlot = h('div', { 'aria-live': 'polite', 'aria-busy': 'true' }, skeleton(4));
  const updated = h('p', { class: 'meta' }, 'Loading live data…');
  const refreshButton = h('button', { class: 'button button--secondary', type: 'button' }, icon('RefreshCw'), 'Refresh');

  let controller: AbortController | null = null;

  async function load(): Promise<void> {
    controller?.abort(); // cancel a refresh that's still running
    controller = new AbortController();
    const { signal } = controller;
    refreshButton.setAttribute('disabled', '');
    alertsSlot.setAttribute('aria-busy', 'true');
    gaugesSlot.setAttribute('aria-busy', 'true');

    const alertsJob = fetchActiveAlerts(signal)
      .then((all): Loaded<Alert[]> => ({
        data: alertsForCounty(all, fips),
        fetched_at: new Date().toISOString(),
        source: 'National Weather Service',
      }))
      .catch((err: Error) => err);
    const gaugesJob = loadCountyGauges(fips, signal).catch((err: Error) => err);

    const [alerts, gauges] = await Promise.all([alertsJob, gaugesJob]);
    if (signal.aborted) return;
    renderAlerts(alertsSlot, county, alerts, load);
    renderGauges(gaugesSlot, county, gauges, load);
    alertsSlot.setAttribute('aria-busy', 'false');
    gaugesSlot.setAttribute('aria-busy', 'false');
    refreshButton.removeAttribute('disabled');
    const now = new Date().toISOString();
    updated.textContent = `Updated ${relativeTime(now)}, at ${clockTime(now)}`;
    updated.dataset.time = now;
  }

  refreshButton.addEventListener('click', () => void load());

  root.replaceChildren();
  append(root, [
    skipLink(),
    siteHeader(),
    h(
      'div',
      { class: 'banner banner--info', role: 'note' },
      h(
        'div',
        { class: 'container banner__inner' },
        icon('Info'),
        h('span', {}, 'In development. This page shows live official data, but status levels and guidance are not ready yet.'),
      ),
    ),
    h(
      'main',
      { id: 'main', class: 'container' },
      h(
        'section',
        { class: 'page-intro', 'aria-labelledby': 'county-title' },
        h('p', { class: 'eyebrow' }, 'Live conditions'),
        h('h1', { id: 'county-title', class: 'page-title' }, `${county} County`),
        h('div', { class: 'page-intro__meta' }, updated, refreshButton),
      ),
      h(
        'section',
        { class: 'section', 'aria-labelledby': 'alerts-title' },
        h('h2', { id: 'alerts-title', class: 'section__title' }, 'Official alerts'),
        alertsSlot,
      ),
      h(
        'section',
        { class: 'section', 'aria-labelledby': 'gauges-title' },
        h('h2', { id: 'gauges-title', class: 'section__title' }, 'Rivers and streams'),
        h(
          'p',
          { class: 'section__intro prose' },
          h('strong', {}, 'Gage height'),
          ' is how high the water surface is at a USGS gauge, in feet. ',
          h('strong', {}, 'Flood stage'),
          ' is the height where the National Weather Service says flooding begins at that spot. Some small creeks have no official flood stage.',
        ),
        gaugesSlot,
      ),
    ),
    siteFooter(),
  ]);

  void load();
  // Keep the "updated" text current, and refresh data on a timer.
  window.setInterval(() => {
    const t = updated.dataset.time;
    if (t) updated.textContent = `Updated ${relativeTime(t)}, at ${clockTime(t)}`;
  }, 60_000);
  window.setInterval(() => void load(), REFRESH_MS);
}
