/**
 * sparkline.ts — a tiny line chart of recent water height, drawn as SVG.
 *
 * No chart library: it's just a polyline scaled to fit a small box.
 * It is decorative (the number and trend text next to it carry the meaning),
 * so it is hidden from screen readers.
 */
import type { Reading } from '../../shared/data/types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 96;
const HEIGHT = 28;
const PAD = 2;

/** Convert readings to "x,y" points inside the box. Exported so it can be tested. */
export function sparklinePoints(series: Reading[], width = WIDTH, height = HEIGHT): string {
  if (series.length < 2) return '';
  const times = series.map((r) => Date.parse(r.time));
  const values = series.map((r) => r.value);
  const t0 = times[0];
  const tSpan = times[times.length - 1] - t0 || 1;
  const vMin = Math.min(...values);
  // A flat line still needs a little vertical room, so use at least 0.2 ft of range.
  const vSpan = Math.max(Math.max(...values) - vMin, 0.2);
  return series
    .map((r, i) => {
      const x = PAD + ((times[i] - t0) / tSpan) * (width - PAD * 2);
      const y = height - PAD - ((r.value - vMin) / vSpan) * (height - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function sparkline(series: Reading[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'sparkline');
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  svg.setAttribute('width', String(WIDTH));
  svg.setAttribute('height', String(HEIGHT));
  svg.setAttribute('aria-hidden', 'true');
  const points = sparklinePoints(series);
  if (points) {
    const line = document.createElementNS(SVG_NS, 'polyline');
    line.setAttribute('points', points);
    line.setAttribute('pathLength', '1'); // lets CSS "draw" the line from left to right
    svg.appendChild(line);
    const last = points.split(' ').pop()!.split(',');
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', last[0]);
    dot.setAttribute('cy', last[1]);
    dot.setAttribute('r', '2.5');
    svg.appendChild(dot);
  }
  return svg;
}
