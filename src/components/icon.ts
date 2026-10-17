/**
 * icon.ts — draws an icon from the Lucide open-source set.
 *
 * Only the icons listed here are included in the app, so unused icons
 * don't make the download bigger. Add new icons to ICONS as needed.
 */
import { createElement, CircleCheck, Eye, TriangleAlert, OctagonAlert, Phone, Info } from 'lucide';

const ICONS = { CircleCheck, Eye, TriangleAlert, OctagonAlert, Phone, Info };

export type IconName = keyof typeof ICONS;

/** Icons are decorative by default (hidden from screen readers) because a text label is always next to them. */
export function icon(name: IconName): SVGElement {
  const svg = createElement(ICONS[name]);
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}
