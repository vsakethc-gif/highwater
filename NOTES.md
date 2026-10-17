# Project notes

Working log for SC-5 Ready. "Problems and fixes" becomes the answer to the judges' question about technical challenges.

## Assumptions

- **County FIPS codes** in `src/config.ts` come from the brief and have not been checked against Census data yet. They get checked in Phase 1.
- **Live site:** https://vsakethc-gif.github.io/sc5-ready/ (repo: https://github.com/vsakethc-gif/sc5-ready).
- **The repo must be public:** GitHub Pages is free only for public repositories, and the judges may want to read the code anyway.

## Decisions

- **Vite + plain TypeScript, no React.** Fewer concepts to learn and explain, and a smaller download. A tiny helper (`src/lib/dom.ts`) builds page elements and always inserts text safely.
- **Relative paths (`base: './'`) and, later, hash URLs like `#/map`.** These work on GitHub Pages without special server setup.
- **Public Sans + Source Serif 4.** Public Sans is the U.S. government's own open typeface: very readable, has tabular numbers, and signals "civic." Both are bundled with the site (self-hosted), so there are no outside font requests.
- **Lucide icons.** Only the icons the app uses are included, which keeps the download small.
- **Status levels differ by icon, label, fill style, and color**, so people with color-vision differences can still tell them apart.
- **Map library (Phase 2): leaning Leaflet.** It is simpler and much smaller than MapLibre, which is enough for drawing our data on top of a basemap.

## Problems and fixes

- **A gray failed the contrast check.** The first "subtle" gray (`#6b7680`) was 4.37:1 on the page background, under the 4.5:1 WCAG AA minimum. I found it with a small script that computes contrast ratios, then darkened it to `#606b75` (5.13:1). The Normal and Watch badge borders were also too faint, so I darkened them past 3:1.

- **GitHub login didn't stick.** The first `gh auth login` waited for a keyboard answer in a terminal tab that never received it. Fix: run the login in a mode that asks no questions and only prints a one-time code, then approve that code on github.com/login/device in the browser.
- **GitHub refused to upload the deploy workflow.** The error said the login needed the `workflow` permission. GitHub treats workflow files as extra sensitive because they run code on GitHub's computers. Fix: `gh auth refresh -s workflow` and approve once more.

## Open questions for me

- Do you want to keep the name "SC-5 Ready"? (Change it in `src/config.ts` → `APP_NAME`.)

## Later (ideas outside current scope)

- Update the GitHub Actions versions in `deploy.yml`: GitHub warns that the current ones use Node 20, which is being retired. They still work today.

## Manual test script

### Phase 0
1. Open the live URL on a phone and on a computer.
2. The page shows the header "SC-5 Ready", a blue "In development" note, a headline, four status levels, 8 counties, and a footer with "call 911".
3. Each status level shows an icon, a word, and a color.
4. Press Tab once: a "Skip to main content" link appears. Keep pressing Tab: every link shows a blue focus ring.
5. At 360px wide, nothing scrolls sideways.
