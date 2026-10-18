/**
 * textPages.ts — "How it works" (rendered from METHODOLOGY.md) and "About".
 *
 * METHODOLOGY.md is the single source: the same file people read on GitHub
 * is shown in the app, so the two can never disagree.
 */
import { marked } from 'marked';
import methodology from '../../METHODOLOGY.md?raw';
import { APP_NAME } from '../config';
import { h } from '../lib/dom';
import { pageShell } from '../components/layout';

export function renderMethodology(root: HTMLElement): void {
  document.title = `How it works · ${APP_NAME}`;
  const article = h('article', { class: 'prose-page' });
  // The Markdown is our own file in this repo (not user input), so rendering it as HTML is fine.
  article.innerHTML = marked.parse(methodology, { async: false });
  // Wide tables scroll sideways on small screens instead of breaking the page.
  for (const table of article.querySelectorAll('table')) {
    const wrap = h('div', { class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Scrollable table' });
    table.replaceWith(wrap);
    wrap.append(table);
  }
  root.replaceChildren(...pageShell('methodology', h('main', { id: 'main', class: 'container text-page' }, article)));
}

export function renderAbout(root: HTMLElement): void {
  document.title = `About · ${APP_NAME}`;
  const p = (text: string) => h('p', {}, text);
  root.replaceChildren(
    ...pageShell(
      'about',
      h(
        'main',
        { id: 'main', class: 'container text-page' },
        h(
          'article',
          { class: 'prose-page' },
          h('h1', {}, `About ${APP_NAME}`),
          p(
            `${APP_NAME} is a free public web app for the eight counties of South Carolina’s 5th Congressional District: Cherokee, Chester, Fairfield, Kershaw, Lancaster, Lee, Union, and York. It combines official, public data into a clear status for your location and plain-language steps to take.`,
          ),
          p(
            'It was built by a high school student in York County for the 2026 Congressional App Challenge. Parts of the code were written with help from an AI coding assistant; see the AI disclosure in the project’s code repository.',
          ),
          h('h2', {}, 'What it can’t do'),
          h(
            'ul',
            {},
            h('li', {}, 'It is not an official warning system. It can be late, wrong, or missing alerts. Official alerts, local officials, and 911 come first.'),
            h('li', {}, 'It does not predict disasters. It shows official alerts and live readings, and applies the published rules on “How it works.”'),
            h('li', {}, 'River gauge readings are provisional, and many small creeks have no gauge.'),
            h('li', {}, 'FEMA flood zones show long-term risk, not where it is flooding today.'),
          ),
          h('h2', {}, 'Privacy'),
          p(
            'The app has no accounts and no tracking. If you use “Use my location,” your location stays in your browser. It is sent only to the public services that answer for that spot (the National Weather Service forecast and FEMA’s flood map), and it is never saved or put in the web address.',
          ),
          h('h2', {}, 'Data credits'),
          p(
            'U.S. Geological Survey (river levels), NOAA National Water Prediction Service (flood stages), National Weather Service (alerts and rain forecast), FEMA National Flood Hazard Layer (flood zones), U.S. Census Bureau (population data and boundaries). Map © OpenStreetMap contributors, OpenMapTiles, OpenFreeMap.',
          ),
          h('p', {}, h('a', { href: 'https://github.com/vsakethc-gif/highwater' }, 'Source code on GitHub')),
        ),
      ),
    ),
  );
}
