/**
 * home.ts — Phase 0 placeholder page.
 *
 * It shows what the app will do and tests the design system (fonts, colors,
 * status badges) on a real deployed page. Phase 1 replaces it with live data.
 */
import { APP_NAME, COUNTIES, DISCLAIMER } from '../config';
import { h } from '../lib/dom';
import { LEVELS, type Level } from '../lib/hazards/levels';
import { statusBadge } from '../components/statusBadge';
import { icon } from '../components/icon';

export function renderHome(root: HTMLElement): void {
  document.title = `${APP_NAME} · Hazard readiness for SC-5`;

  const levelRows = ([0, 1, 2, 3] as Level[]).map((l) =>
    h('li', {}, statusBadge(l), h('span', {}, LEVELS[l].meaning)),
  );

  const countyRows = COUNTIES.map((c) =>
    h('li', {}, h('span', {}, c.name), h('span', { class: 'meta num' }, c.fips)),
  );

  root.replaceChildren(
    h('a', { class: 'skip-link', href: '#main' }, 'Skip to main content'),

    h(
      'header',
      { class: 'site-header' },
      h('div', { class: 'container site-header__inner' }, h('a', { class: 'site-header__name', href: './' }, APP_NAME)),
    ),

    h(
      'div',
      { class: 'banner banner--info', role: 'note' },
      h(
        'div',
        { class: 'container banner__inner' },
        icon('Info'),
        h('span', {}, 'In development. Live hazard data is not shown yet. Use official sources below.'),
      ),
    ),

    h(
      'main',
      { id: 'main', class: 'container' },
      h(
        'section',
        { class: 'section', 'aria-labelledby': 'intro-title' },
        h('p', { class: 'eyebrow' }, 'South Carolina’s 5th District'),
        h('h1', { id: 'intro-title', class: 'page-title' }, 'Know what is happening near you, and what to do about it'),
        h(
          'p',
          { class: 'lede prose' },
          'A free public tool that combines live river levels, National Weather Service alerts, FEMA flood zones, and Census data into a clear status for your location, with plain-language steps to take.',
        ),
      ),

      h(
        'section',
        { class: 'section', 'aria-labelledby': 'levels-title' },
        h('h2', { id: 'levels-title', class: 'section__title' }, 'Four status levels'),
        h('ul', { class: 'level-list' }, ...levelRows),
      ),

      h(
        'section',
        { class: 'section', 'aria-labelledby': 'counties-title' },
        h('h2', { id: 'counties-title', class: 'section__title' }, 'Counties covered'),
        h('ul', { class: 'county-list' }, ...countyRows),
        h('p', { class: 'meta section__note' }, 'Numbers are Census county codes (FIPS).'),
      ),
    ),

    h(
      'footer',
      { class: 'site-footer' },
      h(
        'div',
        { class: 'container prose' },
        h('p', { class: 'emergency-line' }, icon('Phone'), h('a', { href: 'tel:911' }, 'In an emergency, call 911')),
        h('p', {}, DISCLAIMER),
        h(
          'p',
          {},
          'Official alerts: ',
          h('a', { href: 'https://www.weather.gov/' }, 'National Weather Service'),
          ' · ',
          h('a', { href: 'https://www.scemd.org/' }, 'SC Emergency Management Division'),
        ),
      ),
    ),
  );
}
