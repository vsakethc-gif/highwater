# Project notes

Working log for SC-5 Ready. "Problems and fixes" becomes the answer to the judges' question about technical challenges.

## Assumptions

- **County FIPS codes** are verified against Census TIGERweb (Phase 1). All 8 match the brief.
- **"Active gauge"** means it reported gage height in the last 7 days when `scripts/build-gauges.mjs` last ran. That gives 39 gauges across SC-5, 17 with official flood stages.
- **Trend rule:** compare the newest reading with the oldest one inside the last 3 hours. A change of 0.1 ft or more is "rising" or "falling"; less is "steady."
- **Live site:** https://vsakethc-gif.github.io/sc5-ready/ (repo: https://github.com/vsakethc-gif/sc5-ready).
- **The repo must be public:** GitHub Pages is free only for public repositories, and the judges may want to read the code anyway.

## Decisions

- **Vite + plain TypeScript, no React.** Fewer concepts to learn and explain, and a smaller download. A tiny helper (`src/lib/dom.ts`) builds page elements and always inserts text safely.
- **Relative paths (`base: './'`) and, later, hash URLs like `#/map`.** These work on GitHub Pages without special server setup.
- **Public Sans + Source Serif 4.** Public Sans is the U.S. government's own open typeface: very readable, has tabular numbers, and signals "civic." Both are bundled with the site (self-hosted), so there are no outside font requests.
- **Lucide icons.** Only the icons the app uses are included, which keeps the download small.
- **Status levels differ by icon, label, fill style, and color**, so people with color-vision differences can still tell them apart.
- **New USGS API first, legacy as fallback.** USGS is retiring the legacy API starting November 2026, during judging.
- **We compute flood categories ourselves** from NOAA's official stages, instead of copying NOAA's label. The rule is visible and testable, and stays in sync with the USGS reading we show.
- **Gauge list is pre-built** by a script into `public/data/gauges.json` (9.5 KB). Visitors don't re-ask USGS which gauges exist on every page load.
- **Each live section loads on its own**, so if one agency is down, the other's data still shows.
- **Address search will go through the Worker** (the Census Geocoder blocks browsers). ZIP search will use a static ZIP center list.
- **Map library (Phase 2): leaning Leaflet.** It is simpler and much smaller than MapLibre, which is enough for drawing our data on top of a basemap.

## Problems and fixes

- **A gray failed the contrast check.** The first "subtle" gray (`#6b7680`) was 4.37:1 on the page background, under the 4.5:1 WCAG AA minimum. I found it with a small script that computes contrast ratios, then darkened it to `#606b75` (5.13:1). The Normal and Watch badge borders were also too faint, so I darkened them past 3:1.
- **GitHub login didn't stick.** The first `gh auth login` waited for a keyboard answer in a terminal tab that never received it. Fix: run the login in a mode that asks no questions and only prints a one-time code, then approve that code on github.com/login/device in the browser.
- **GitHub refused to upload the deploy workflow.** The error said the login needed the `workflow` permission. GitHub treats workflow files as extra sensitive because they run code on GitHub's computers. Fix: `gh auth refresh -s workflow` and approve once more.

- **The main USGS API is being retired during judging.** USGS's own notice says WaterServices degrades from November 2026 and shuts down in early 2027, after our submission but while judges test the app. Fix: use the new Water Data API as the main source and keep the old one only as an automatic fallback. Both are tested with saved real responses.
- **NWS blocked requests with no "User-Agent" (403 error).** Browsers always send one, so the live page works. Our scripts send a descriptive one, as NWS asks.
- **The alert feed includes "cancelled" and "expired" messages.** A cancelled Flood Warning still has the event name "Flood Warning". Without care, the app would warn people about something that's over. Fix: read the VTEC action code (NEW, CON, CAN, EXP, ...) and drop CAN/EXP. Tested with a real cancelled warning.
- **A brand-new Census key was rejected as "invalid"** for a few minutes after activation. Fix: wait and retry; it worked shortly after.
- **Census now requires an API key for every request** (it redirects to a "Missing Key" page). Fix: you request a free key; it's used only by the build script, never in the browser.
- **The Census Geocoder doesn't allow browsers (no CORS header).** Fix: route address search through our Worker; ZIP codes use a static list.
- **FEMA returned a generic 400 error** because we asked for a field (`EFF_DATE`) that this layer doesn't have. Fix: read the layer's field list first and request only real fields.
- **USGS box searches pulled in North Carolina gauges and dead gauges** (one last reported in 2021). Fix: build the gauge list per county and keep only gauges with a reading in the last 7 days.
- **NOAA writes missing numbers as -9999 or -999.** Treating those as real heights would be a bug. Fix: convert them to "no value" in the build script.

## Open questions for me

- Do you want to keep the name "SC-5 Ready"? (Change it in `src/config.ts` → `APP_NAME`.)
- **OpenRouteService key (needed for Phase 4):** sign up at https://openrouteservice.org/dev/#/signup.
- **ORS avoid polygons are limited to 20 km across and 200 km².** Many warning polygons are bigger, so in Phase 4 we'll trim avoid areas to the part near the route. This could limit how well the route planner works; we'll know by the Wednesday cut-rule check.

## Later (ideas outside current scope)

- Add a scheduled GitHub Action (Phase 5) that touches Supabase every few days, so the free project doesn't pause after 7 days with no activity during judging.
- Re-run `node scripts/build-gauges.mjs` before submission, in case gauges went offline or came back.
- Update the GitHub Actions versions in `deploy.yml`: GitHub warns that the current ones use Node 20, which is being retired. They still work today.

## Manual test script

### Phase 0
1. Open the live URL on a phone and on a computer.
2. The page shows the header "SC-5 Ready", a blue "In development" note, a headline, four status levels, 8 counties, and a footer with "call 911".
3. Each status level shows an icon, a word, and a color.
4. Press Tab once: a "Skip to main content" link appears. Keep pressing Tab: every link shows a blue focus ring.
5. At 360px wide, nothing scrolls sideways.

### Phase 1
1. Open the live URL. It shows "York County", an "Updated …" time, and a Refresh button.
2. **Official alerts:** either a list of alerts (each with "Read the official alert text") or "No active National Weather Service alerts for York County right now."
3. **Rivers and streams:** 10 gauges, each with height in feet, a trend (Rising, Falling, Steady), the time it was read, and a small line chart. Catawba River below Lake Wylie Dam says "No official flood stage"; the others show "Flood stage N ft."
4. Compare one reading with waterdata.usgs.gov for the same gauge. The numbers should match.
5. Click Refresh: the button disables briefly, then the times update.
6. Turn off Wi-Fi and click Refresh: each section shows its own "Couldn't load …" message with a "Try again" button.
