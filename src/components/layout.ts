/**
 * layout.ts — the header and footer shared by every page.
 * The footer always shows the 911 line and links to official sources.
 */
import { APP_NAME, DISCLAIMER } from '../config';
import { h } from '../lib/dom';
import { icon } from './icon';

export function skipLink(): HTMLAnchorElement {
  return h('a', { class: 'skip-link', href: '#main' }, 'Skip to main content');
}

export function siteHeader(): HTMLElement {
  return h(
    'header',
    { class: 'site-header' },
    h('div', { class: 'container site-header__inner' }, h('a', { class: 'site-header__name', href: './' }, APP_NAME)),
  );
}

export function siteFooter(): HTMLElement {
  return h(
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
        'Official sources: ',
        h('a', { href: 'https://www.weather.gov/alerts' }, 'National Weather Service alerts'),
        ' · ',
        h('a', { href: 'https://www.scemd.org/' }, 'SC Emergency Management Division'),
      ),
    ),
  );
}
