/**
 * icon.ts — draws an icon from the Lucide open-source set.
 *
 * Only the icons listed here are included in the app, so unused icons
 * don't make the download bigger. Add new icons to ICONS as needed.
 */
import {
  createElement,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CloudOff,
  ExternalLink,
  Eye,
  Info,
  MapPin,
  OctagonAlert,
  Phone,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Waves,
} from 'lucide';

const ICONS = {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CloudOff,
  ExternalLink,
  Eye,
  Info,
  MapPin,
  OctagonAlert,
  Phone,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Waves,
};

export type IconName = keyof typeof ICONS;

/** Icons are decorative by default (hidden from screen readers) because a text label is always next to them. */
export function icon(name: IconName): SVGElement {
  const svg = createElement(ICONS[name]);
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}
