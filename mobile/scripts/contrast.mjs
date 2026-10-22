/**
 * contrast.mjs — checks every text color against the backgrounds it sits on, in both themes,
 * using the WCAG formula. Body text needs 4.5:1; large text and icons need 3:1.
 * Run: node scripts/contrast.mjs
 */
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const THEMES = {
  light: { bg: '#F7F5F0', surface: '#FFFFFF', surfaceSunken: '#EFEBE3', ink: '#0F1A24', inkMuted: '#47535E', inkFaint: '#5F6A74', accent: '#0B4F7A', accentSoft: '#DCE9F2', onAccent: '#FFFFFF',
    status: [['#2B6A5E', '#E3F0EC'], ['#8A5A00', '#FBEFD3'], ['#A8420F', '#FBE3D5'], ['#9A1B30', '#F8DADF']] },
  dark: { bg: '#0B1117', surface: '#121A22', surfaceSunken: '#18222C', ink: '#E9EEF2', inkMuted: '#A9B5C0', inkFaint: '#8794A0', accent: '#6BB6E8', accentSoft: '#16324A', onAccent: '#0B1117',
    status: [['#7CCBB8', '#12302A'], ['#F2C46B', '#3A2C0C'], ['#FF9F6E', '#3E1D0E'], ['#FF8A9B', '#42121B']] },
};
const NAMES = ['Normal', 'Watch', 'Warning', 'Danger'];
let fails = 0;
for (const [theme, t] of Object.entries(THEMES)) {
  const rows = [];
  for (const fg of ['ink', 'inkMuted', 'inkFaint', 'accent']) for (const bg of ['bg', 'surface', 'surfaceSunken']) rows.push([`${fg} on ${bg}`, t[fg], t[bg], 4.5]);
  rows.push(['accent on accentSoft', t.accent, t.accentSoft, 4.5], ['onAccent on accent', t.onAccent, t.accent, 4.5], ['ink on accentSoft', t.ink, t.accentSoft, 4.5]);
  t.status.forEach(([fg, bg], i) => {
    rows.push([`${NAMES[i]} fg on its bg`, fg, bg, 4.5], [`${NAMES[i]} fg on surface`, fg, t.surface, 4.5], [`${NAMES[i]} fg on bg (icons, 3:1)`, fg, t.bg, 3], [`ink on ${NAMES[i]} bg`, t.ink, bg, 4.5], [`inkMuted on ${NAMES[i]} bg`, t.inkMuted, bg, 4.5]);
  });
  console.log(`\n${theme.toUpperCase()}`);
  for (const [name, fg, bg, need] of rows) {
    const r = ratio(fg, bg);
    const ok = r >= need;
    if (!ok) fails++;
    console.log(`${ok ? ' ok ' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (need ${need})  ${name}`);
  }
}
console.log(`\n${fails} failing pair(s)`);
process.exitCode = fails ? 1 : 0;
