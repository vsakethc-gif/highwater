# Project notes

Working log for Highwater (originally called SC-5 Ready). "Problems and fixes" becomes the answer to the judges' question about technical challenges.

## Assumptions

- **County FIPS codes** are verified against Census TIGERweb (Phase 1). All 8 match the brief.
- **"Active gauge"** means it reported gage height in the last 7 days when `scripts/build-gauges.mjs` last ran. That gives 39 gauges across SC-5, 17 with official flood stages.
- **County rain forecast** uses the county seat's forecast point (e.g. York for York County). A spot (GPS or ZIP) uses its own point.
- **ZIP codes** are placed at their Census center point and assigned to the county that point falls in.
- **"Insufficient data" tracts:** fewer than 200 people or 50 households. That catches Winthrop University's dorm tract (York 606: 1,471 people, all in group housing, 0 households) and a state prison tract in Lee County (9203.01), plus one 190-person tract in Lancaster.
- **Map county statuses** use alerts and gauges only (no rain forecast), and the map says so.
- **Trend rule:** compare the newest reading with the oldest one inside the last 3 hours. A change of 0.1 ft or more is "rising" or "falling"; less is "steady."
- **Live site:** https://vsakethc-gif.github.io/highwater/ (repo: https://github.com/vsakethc-gif/highwater). Renamed from SC-5 Ready on 2026-10-18; the Cloudflare Worker and Turnstile widget kept their original sc5-ready names.
- **The repo must be public:** GitHub Pages is free only for public repositories, and the judges may want to read the code anyway.

- **Dark-first phone app (REDESIGN.md, Oct 23):** new installs start in Dark. Anyone can still pick System or Light in More → Settings. The brief says "dark by default" and also "keep light working"; this is the reading that does both.
- **The storm timeline is made up, not Helene.** Scrubbing needs one storm with a Normal, Watch, Warning and Danger moment. The real Helene replays only have two moments (Sept 27 and Sept 29), so the timeline uses four made-up York County moments (a new calm one plus the existing Watch, Warning and Flash Flood Emergency scenarios). It is labeled "Made-up storm" and "SIMULATED" everywhere.

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
- **Map: MapLibre GL + OpenFreeMap "Positron" basemap.** CARTO's free tiles now need an API key (and show a watermark without one); OpenFreeMap is free, keyless, has no request limits, allows public sites, and has the same light style. It's a vector basemap, which needs MapLibre instead of Leaflet. MapLibre is large (287 KB compressed), so the map page loads only when opened; the main screen is 22 KB.
- **The engine maps ALL NWS alert types now** (not just floods). The table is cheap, and showing "Normal" during a Tornado Warning because we only checked floods would be misleading and unsafe. Detailed guidance for flood, tornado, and severe storms is done; other hazards get careful generic guidance ("follow the official alert") until P1a.
- **Information-only alerts** (Hazardous Weather Outlook, Frost Advisory) are listed but never raise the status. The outlook is issued almost daily, and the app would otherwise sit at "Watch" all the time.
- **Scores are percentile ranks within SC-5** (0–100), so vulnerability and exposure use the same scale and can be averaged into priority. The real percentages are always shown next to the scores.
- **Scores are computed in the browser** from raw percentages, by tested code (`shared/hazards/vulnerability.ts`), not inside the data script. One place for the rule, and it's tested.
- **"Can't confirm" instead of "Normal"** when any key source fails or gauge readings are stale (brief 5.6).
- **Exact locations are never saved or put in the URL.** Only the chosen county is remembered in the browser.
- **A tornado or severe storm Warning blocks the route button even during a flood**: never suggest driving into a tornado.
- **Methodology page renders METHODOLOGY.md directly**, so the app and the repo can't disagree.
- ~~Map library: leaning Leaflet.~~ Replaced by MapLibre (see above).
- **Hand-written service worker instead of a plugin (Workbox).** It's about 70 lines, so every line can be explained; a tiny build step fills in the file list and a version number.
- **The service worker never caches government API data.** The app keeps its own labeled "last loaded" copy per county instead, so old data can't be mistaken for live data.
- **Guidance tables for 9 more hazards** (tropical, winter, cold, heat, wind, fire weather, fog, air quality, evacuation), each line taken from an official page. A Watch shows "get ready" steps; a Warning shows "act now" steps.
- **One Cloudflare Worker** (`/worker`) for routing and address search, so the ORS key never reaches the browser. Only this app's pages may call it.
- **Route scoring formula:** minutes + 30 per warning area entered + 5 per mile inside one + 3 per FEMA flood zone crossed. Transparent and shown on every card.
- **Reports are written only through the Worker; reads come straight from Supabase.** Writes need the Turnstile check and validation; reads are safe because Row Level Security only exposes active reports and safe columns.
- **No accounts for reporters.** A random device ID (hashed with a secret in the Worker) is enough to limit spam without collecting identity.
- **Expiry is in the read rule**, not a scheduled cleanup job: flooded-road reports stop showing after 48 hours, others after 30 days, with nothing to run.
- **Six scenarios** now, covering four hazard types (flood, tornado, heat, tropical) and all of Watch, Warning, and Danger.
- **Design refresh (Oct 18):** a bottom tab bar on phones (like a native app, and reachable with a thumb), the logo and a serif wordmark in a one-row header on wide screens, a status card tinted in its level's color, "Plan a route" moved right under the status card, and a two-column layout on wide screens (advice on the left, live data on the right). Section headings open with a heavy rule, newspaper style.
- **Helene replays use only real archived data** (USGS readings, NWS alerts from the Iowa Environmental Mesonet archive, a USGS rain gauge), built by a script anyone can re-run. A real past event is more convincing than made-up numbers, and the brief asked for it.
- **Replays are shown "as if now"** (times shifted), so the 2-hour freshness rule works unchanged. Alert headlines keep their real dates.
- **The Helene files load only when picked** (about 10–14 KB compressed each), so they don't slow the Status page.
- **The route planner's map loads only when needed** ("Show map", tapping the map, or when routes are ready). The route page's performance went from 76 to 96.
- **Deploy pinned to Ubuntu 24.04** and actions updated to their Node 24 versions, so GitHub's runner change on Oct 19 can't break the deploy during judging.
- **Animations (Oct 18), at your request:** purposeful and short. New content rises in, river sparklines draw themselves, a "Live" dot pulses only for fresh live data, loading boxes shimmer, expanders and dialogs ease open, and buttons press in. All of it lives in `src/styles/motion.css`, only opacity and transform move (so nothing shifts), and it all switches off when a phone asks for reduced motion. This relaxes the brief's "under 200ms" rule slightly (most are about 250ms, sparklines 900ms) because you asked for more motion.
- **Level meter on the status card:** a four-step Normal → Watch → Warning → Danger scale with the current step marked, so people see how serious it is at a glance. It is hidden from screen readers because the badge already says the level in words.
- **Route elevation (Oct 18):** routes now show their lowest point and count "low dips" (creek and river valleys), using heights OpenRouteService returns in the same request (no extra quota). Each dip adds 2 points to the route score.

### Phone app (started Oct 18–19)
- **One brain, two apps.** The rules, guidance, data code, scenarios, and config moved into `/shared`. The website (`/src`) and the phone app (`/mobile`) both import it. Each app plugs in only how it loads data files and saves things (`shared/platform.ts`). Moved with `git mv` and a script that rewrote every import, then checked: 170 tests pass and every web page was clicked through.
- **Expo SDK 58** (the current one, released Sept 29, 2026), so it runs in today's Expo Go. Every native library was checked against the list built into Expo Go 58 before installing it, and installed with `npx expo install` so the versions match.
- **JavaScript tabs, not native tabs:** they let the tab bar use the same Lucide icons as the website, with a label on every tab and our own sliding indicator.
- **Reanimated directly, not Moti:** Moti isn't built into Expo Go and its last release predates Reanimated 4. Reanimated is what Moti uses underneath anyway.
- **How Reanimated keeps animations smooth:** a phone app has two main "threads" (lanes of work). The JavaScript thread runs our app logic (loading data, running the rules). The UI thread draws the screen. Reanimated runs animations on the UI thread, so even while the app is busy loading river data, the status card's color change and the water rising in the gauge tubes stay at 60 frames per second.
- **Built-in data is bundled into the phone app** (about 160 KB, copied from `public/data` before each start), so it works offline from the first launch.
- **Dark mode** is designed from the same tokens as light mode; in Scenario Mode the accent turns slate, so a simulation never looks like live data.

### Phone app, round 2 (Oct 21, new brief: MOBILE_BRIEF.md)
- **Design tokens from the brief, contrast-checked** with `mobile/scripts/contrast.mjs` (WCAG formula, every text/background and status pair, both themes). All pass except one value from the brief: light `inkFaint` #68737D was 4.07:1 on the sunken background, so it was darkened to #5F6A74 (4.65:1 there, 5.07:1 on the page). Fonts: Public Sans (UI) and Newsreader (the big status word and titles).
- **Our own bottom sheet** (Reanimated + Gesture Handler) instead of @gorhom/bottom-sheet, which only promises support for the older gesture library; Expo SDK 58 ships Gesture Handler 3. The place and scenario pickers use the phone's native form sheet instead.
- **The water line** is one component (`components/ui/WaterLine.tsx`) used by the hero card, gauge tubes, onboarding art, and empty states, so the signature looks identical everywhere.
- **Phone Report and Route tabs (Oct 23) reuse the website's shared code**: the same report checks, Worker, planner, scoring and shelter list. The phone only adds its own screens. The "I'm human" check (Turnstile) has no phone version, so the app shows a tiny page from our website (`public/turnstile.html`) inside a web view, and that page hands the one-time token back to the app.
- **The Worker now accepts requests with no Origin header** (the phone app, which isn't a web page), while web pages from other sites are still refused. A program outside a browser could fake the header anyway, so the real protections are the same for everyone: Turnstile on reports, input checks, and rate limits.
- **Hidden Design Gallery** (long-press the version in More) shows every component in every state, replays the animations, and runs a "Demo ready" check.

### Phone app, round 3 (Oct 23 night, REDESIGN.md "Living Status")
- **Patterns borrowed, never assets.** Apple Weather: the home screen is the condition, a huge level word, translucent modules with small uppercase labels, the hero condensing as you scroll. Flighty: the live status ribbon at the top and the alert time bars. Stock and video apps: a timeline you drag with a finger. Everything is drawn by us in code.
- **The scene is SVG + Reanimated, not Skia.** Skia isn't installed, and every new native library adds risk the night before the freeze. Two SVG waves sliding sideways and 3 rain layers (instead of 80 separate streaks) keep it to a handful of moving parts, all on the UI thread.
- **Two sky "slots" for the level change.** The new level's colors are always written into the slot that is hidden, then the screen fades over to it, so colors never jump on the slot you're looking at. The water has a copy in each slot and fades with the sky.
- **Scene text contrast.** White, 72% white and the level accent pass 4.5:1 on every scene. The brief's 55% white for small labels failed inside a module on Watch (4.10:1), so labels and times use 62% white (4.77:1 or better). All checked by `mobile/scripts/contrast.mjs` (it now checks the scene too). The brief's dark `inkFaint` #7C8894 was 4.50:1 on raised surfaces, right at the line, so it's #7F8B97.
- **Floating chrome is opaque without blur.** On Android (and with Reduce Transparency) there's no blur, so the ribbon and the timeline use a 95% opaque dark backing; otherwise text scrolling underneath showed through.
- **Impeccable critique findings applied:** at Normal the hero said "Flooding" in the accent color, which read as if flooding was happening; it now says "No active alerts here," and the compact title drops the hazard at Normal. Not applied: impeccable's ban on small uppercase labels above headings, because the brief asks for Weather-style module labels (the brief wins).

### Phone app, round 4 (Oct 24, the other screens)
- **Animations replay on every visit.** Tabs stay alive in the background, so their entrances only played once. `useFocusReplay` re-creates a screen's content each time you come back, so the modules rise in again and the Status water drains and refills. Tabs crossfade instead of switching instantly.
- **Map (Apple Maps / Citymapper):** the sheet never closes; it rests at peek (summary line + layer chips), half, or full. Tapping anything raises it to half with a crossfade, and the camera flies there. Gauges are round markers with the height inside and a ring in the flood color; the picked one grows and shows its name while the others dim. Glass search pill on top, round glass buttons on the right.
- **Gauge page (stock apps):** big number that counts up and follows your finger while you drag the chart; the chart line is colored by flood stage and draws itself in. No 24H/48H/7D selector: the app only loads the last several hours of readings, and a range button with no data behind it would be fake.
- **Alert page (phone severe-alert style):** a header in the level's colors, a time bar (started → now → ends), plain words first, then what to do, then the folded official text. Says "Simulated" in Scenario Mode.
- **Route (Citymapper):** compact safety strip, route lines draw in, the chosen route glows, swiping the cards moves the map, and each card has a route-makeup bar (share of miles inside warning areas, plus flood-zone crossing ticks). The bar shows how much, not where; the map shows where.
- **Report (Uber):** two big columns of category tiles, the place name in a pill on the map, a bigger success check, and the step's main button pinned above the tab bar.
- **More (Settings app):** colored icon tiles and a "Replay a storm" card with a small living scene that starts the storm timeline.
- **Comparison pass against the reference apps:** the one clear gap left after this round was Uber's pinned button, which is now done. Not copied on purpose: Apple Maps puts search inside the sheet, but the brief asks for a floating pill on top.

- **Route tab switched off on the phone (Oct 24, your call):** after testing it, you found the route planner not useful on the phone, so `TABS_ON.route` is false in `mobile/src/features.ts`. The tab and Status's "Plan a route out" tile are hidden; the code is kept, and setting the flag back to true restores both. The website's route planner is unchanged. The demo script now shows the Map instead.

### Motion review with emil-design-eng (Oct 24)
Reviewed every animation against Emil Kowalski's design-engineering rules (the skill is web/CSS; the same principles were applied to Reanimated):
- **Stronger curves.** The old ease-out curves were soft. Now a strong ease-out (0.23, 1, 0.32, 1) for entering and settling, a strong ease-in-out for things crossing the screen, and no ease-in anywhere (the old "exit" curve was ease-in).
- **Press feedback answers at touch-down.** Buttons and cards shrink in 120 ms ease-out the moment you touch them, then spring back when you let go (before, a spring took a moment to get going). Press scales are 0.95 to 0.98; the deepest ones (0.9) were too much.
- **Nothing appears from nothing.** Map markers and the recenter button used to grow from size 0; now they pop in from 85% with a fade (220 ms, 25 ms apart).
- **UI motion stays under 300 ms.** The level word and the gauge number now rise in 280 ms (were 400), the checklist tick 280 ms, the alert time bar 450 ms (was 600). The scene's sky crossfade stays at 400 ms on purpose: it's the atmosphere, not a control.
- **Haptics only when something happens.** The map sheet taps once when it catches a new height, not when it springs back to the same one.
- **You can feel you've grabbed it.** The storm timeline thumb grows a little while your finger is on it.
- **Kept on purpose:** the tab crossfade (you asked for smooth transitions; the skill would leave tab switches unanimated because they happen so often), and entrances replaying on each visit (you asked; the stagger is short, 40 ms per module).

### Animation review fixes (Oct 24, second pass with emil-design-eng)
Rules for this pass: only faster, smoother or more purposeful; signature moments untouched (scene color change, water rising, route line drawing, Scenario timeline); Reduce Motion, haptics and the UI thread kept; emergency information instant.
- **Emergency information is now truly instant.** Danger modules, the Danger level word, a Danger alert's header and the power-line warning had a 200 ms fade; now they have no entrance at all.
- **No animation on the most repeated action.** Switching tabs no longer crossfades (it happens 100+ times a day); the sliding pill already shows where you went. The pill now eases across in 220 ms (ease-in-out) instead of a spring that wobbled, and it retargets smoothly if you tap fast. Same for the segmented control.
- **Return visits are quicker.** Coming back to Status or More still replays the entrance, but in 180 ms with a 25 ms stagger (first visit: 280 ms, 40 ms).
- **Sheets keep your flick's speed.** After a drag, the map sheet used to restart its settle spring from zero (a tiny hitch); now the flick's velocity carries through. The sheet spring settles in about 300 ms without wobble (was about 400 ms), and the other bottom sheet carries velocity too.
- **Shorter UI timings:** map detail crossfade 180 ms in / 120 ms out (was 280/200), level badge color 240 ms (was 400), sparkline draw 300 ms with no delay (was 720 ms total; they replay on every visit now), rain bars 280 ms, gauge chart draw 500 ms (was 900), alert expander chevron 200 ms, step slides 240 ms with a strong ease-out, the loading bar's back-and-forth uses ease-in-out.
- **Crash fixed:** the storm timeline crashed when opened ("Cannot access 'held' before initialization") because the thumb-grow value from the previous motion pass was declared after the gesture that used it. Found while testing this pass in the browser; fixed by declaring it first.
- **Three small feedback animations added:** (1) when the level changes, the hero's headline and context line crossfade (200 ms) with the level word instead of snapping; (2) the live ribbon's label crossfades (160 ms) between LIVE, UPDATING… and back, so a refresh is visible; (3) the Report pinned button's label crossfades (160 ms) between "Use this spot" and "Send report", so you notice the step changed. The headline crossfade is skipped at Danger, so emergency text never waits.

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

- **CARTO basemap tiles now require an API key.** Found by reading their current docs before building. Fix: switched to OpenFreeMap (free, keyless) and MapLibre GL to draw it.
- **Census numbers for some tracts were misleading** (one showed 100% poverty). Diagnosed by printing every outlier: it was Winthrop's dorms, where Census could measure poverty for only 3 of 1,471 residents, and a prison tract with no households at all. Fix: a documented "insufficient data" rule (fewer than 200 people or 50 households), tested.
- **Our first alert table had names NWS doesn't use anymore.** Checked every name against NWS's official list (`/alerts/types`): found "Tropical Cyclone Statement" should be "Tropical Cyclone Local Statement", confirmed the 2025 heat/cold renames, and found missing events (Snow Squall Warning, Freeze Warning, Extreme Fire Danger...). Fixed and tested.
- **Measuring flood-zone share took real geometry work.** FEMA returns 10,898 high-risk flood polygons for SC-5, 1,000 at a time. The script pages through them, has FEMA simplify them to about 20 m, skips quick non-overlaps with bounding boxes, and computes the overlap area with Turf.js. One broken FEMA polygon is skipped safely. Runs in about 90 seconds.
- **A brand-new library version changed its import style** (MapLibre 6 has no "default export"). Found by the TypeScript check, fixed by importing it as a namespace.
- **Unverified claim caught before publishing.** A draft of METHODOLOGY cited specific flash-flood numbers I hadn't checked; I replaced them with a fact I could verify (SC averages about 48 in of rain a year) and labeled the 2-inch rule as this app's own cautious choice.

- **Offline mode broke in a way that would also have hit the live site.** With the server shut down, the app shell loaded but the "Get ready" page code failed, even though it was in the cache. Diagnosed by listing the cache (the file was there) and checking response headers: servers (including GitHub Pages) send `Vary: Accept-Encoding`, and the browser's request for a code module didn't match the saved request exactly. Fix: match cached files by address only (`ignoreVary: true`). Re-tested with the server off: all 12 hazard checklists loaded.
- **Phones would never have seen updates to the offline script itself.** The cache version only counted the app's files, not the service worker's own code. Fix: include the worker's code in the version number.
- **A build placeholder was replaced in the wrong place.** The text `__PRECACHE__` also appeared in a comment, and the build replaced the comment's copy. Fix: replace the exact line of code instead.
- **Some official safety pages were thin.** The NWS fog and fire-weather pages and AirNow's AQI page didn't list the specific steps; I found the detailed official pages (fog-driving, wildfire-ww) instead, and dropped two tips I couldn't source (low-beam headlights, bring pets inside for cold).
- **MapLibre's background worker logs an error in development mode only** (not in the production build, where the console is clean). Noted, not worth fixing.

- **The routing service limits avoid areas to 20 km across, but warning areas are bigger.** Fix: cut each warning area into tiles of about 14 km × 14 km and send only the tiles near the trip. Tested that every tile stays under 20 km and 200 km².
- **Routing failed when the start was inside the warning area.** Asking to avoid the area you're standing in is impossible, so the router errored (502). Fix: leave out tiles that contain the start or destination, and tell the person "You're starting inside an active warning area."
- **The first scoring formula couldn't tell routes apart** when they all start inside the warning area (every route "passed through 1"). Fix: count only warning areas a route *enters*, and add miles driven inside warning areas (5 points per mile). Tested: the route that leaves sooner now wins.
- **FEMA's shelter service took over 20 seconds**, and the planner waited for it. Fix: 12-second limit on shelters, 10 seconds on flood-zone counts; town choices load separately so "Away from the warning area" works at once.
- **OpenRouteService stopped answering requests that used our key** (it hung instead of erroring) a few minutes after working fine. Diagnosed by comparing requests with and without the key, on both ORS addresses: no-key requests got an instant "401," keyed ones hung. Fix on our side: the Worker gives up after 20 seconds, the app after 25, and the app switches to the OSRM backup with its "does not avoid hazard areas" banner. Verified in the browser.
- **Account setup snags:** keyboard input never reached the terminal tabs (GitHub login, Cloudflare secret prompt), so we used approval links in the browser and a git-ignored `.dev.vars` file instead; Cloudflare needed a workers.dev subdomain, which we registered through Cloudflare's API after the dashboard didn't create one.

- **The brief's "35 feet" for downed power lines didn't match the local utilities.** Both Duke Energy and Dominion Energy SC say 30 feet, so the app uses their number and cites them.
- **SCDOT's pothole page moved** (old link: 404). Found the current Maintenance Work Request app on SCDOT's own help pages and verified it loads.
- **The "I'm human" check broke after picking a category.** Diagnosed by reading the code after it failed in every browser: rebuilding the form *moved* Cloudflare's iframe, and browsers reload a moved iframe, which breaks the check. Fix: remove the old widget and render a fresh one each time the form is rebuilt. After that, a real report went through end to end.
- **Send problems were too easy to miss.** "Set the location" and similar messages were small gray text under the button. Fix: a clear red alert box that scrolls into view.
- **An open tab broke after an update.** It asked for a page file that a new build had replaced. Fix: if a page file fails to load, reload once to get the new version (a flag prevents a reload loop).
- **Saving a secret key from Notepad didn't work, and a Desktop note was empty.** Fix: the key went from the clipboard straight into the git-ignored file with a small script, which checked it started with `sb_secret_` and cleared the clipboard. It never appeared in chat.
- **Supabase's default permissions let anyone call database functions.** Fix: `schema.sql` explicitly revokes function access from the public roles and grants it only to the secret-key role. Tested: a direct call with the public key is denied.
- **The Status page jumped while loading** (Lighthouse layout shift 0.169). Diagnosed by measuring the status card's real height at 5 screen widths with a script. Fix: the loading placeholder is now the same height, so nothing moves. Performance score went from 89 to 96.
- **The route page jumped even more** (layout shift 0.457): the whole planner appeared only after alerts loaded. Fix: draw the planner right away and keep the Plan button off until alerts are in. Shift dropped to 0.03.
- **Keyboard users couldn't set a report location.** Setting the spot needed GPS or a map tap. Found during the keyboard-only test. Fix: an address/ZIP search box (shared with the route planner) where Enter searches.
- **Error states that said "nothing here" instead of "couldn't load."** Found by blocking each data source on purpose in a test browser. When the report database was down, the list said "No active community reports nearby"; on the route page with alerts down, it said "No active warning areas." Both looked like real answers. Fix: each now says the data couldn't load. The district map's county table also no longer stays on "Loading…" forever.
- **The menu was cut off on small phones** ("Ge…"). Found in screenshots at 360 px. Fix: the menu wraps onto two lines.
- **River gauge rows spilled off the screen at 1024 px** after the two-column layout. Their wide layout was switched on by *screen* width, but they now sit in a narrow column. Fix: a container query, so the rows adapt to the width of their own list.
- **The Helene script missed a real Tornado Watch.** The archive showed Tornado Watch 687 in effect for Lancaster, Fairfield, Kershaw, and Lee at 7:30 AM, but the script dropped it. Diagnosed by printing that product: the same NWS message also *cancelled* a different watch (#684), and the script read #684's "cancelled" code. Fix: match the exact alert number. Now all 10 real alerts appear.
- **Old USGS data lives at a different address.** Asking the usual USGS server for 2024 data returned a "301 redirect" with no data. Fix: call `nwis.waterservices.usgs.gov` directly.
- **The map library runs about 1 second of code on slow phones** (Lighthouse found it was the main-thread bundle, about 1 MB). Switching libraries this late was too risky, so the route page now loads the map only when needed (76 → 96). The district map page still scores about 50, because the map *is* that page.
- **The first "low dip" rule counted ordinary hills.** At 20 ft deep, an 18-mile route had 11 "dips" but crossed only 5 flood zones. Diagnosed by testing three depths on real routes and asking FEMA whether each dip was within 200 m of a high-risk flood zone: 20 ft → 6 of 15; 30 ft → 7 of 11; 40 ft → 7 of 7. Fix: use 40 ft within about ¾ mile on each side, so a "dip" really means a creek or river valley.
- **SDK 58 moved Expo Router's pieces.** `Stack`, `Tabs`, and `Link` now come from separate paths (`expo-router/stack`, `expo-router/js-tabs`), the tab bar receives `navigateToTab()` instead of `navigation`, and `Redirect` isn't re-exported. Found by the TypeScript check and fixed by reading the library's own type files, not guessing.
- **The phone bundler (Metro) couldn't see `/shared` at first.** Expo's docs cover "workspace" setups, which would have changed how the website installs packages. Fix: add `/shared` to Metro's watch list (`mobile/metro.config.js`), which leaves the website untouched. Proved by building the Android bundle.
- **All 36 font weights were being bundled.** Importing from the font packages' main file pulls in every weight. Fix: import only the five weights we use.
- **The selected county was scrolled off-screen.** York is last in the county row, so the chosen chip was hidden. Fix: the row scrolls to the selected county.

- **District map warnings and messy labels (Oct 19).** Testing every map interaction in a browser found: (1) the browser console filled with warnings when zooming, from three layers in the free basemap's style that compare numbers some map features don't have; fix: load the style ourselves and make those comparisons treat a missing number safely (the map looks the same). (2) Our colored neighborhoods were drawn on top of the town names, washing them out; fix: draw them beneath the basemap's labels. (3) County names repeated ("LEE" three times) because they were labeled per map tile; fix: one label point at the center of each county. (4) Cherokee, Union, and York names were hidden by gauge dots; fix: dots no longer block labels, and county names draw on top. (5) On phones, something scrolled into view (for example by the keyboard) could end up under the bottom tab bar; fix: the page keeps a tab-bar-sized gap when scrolling (WCAG 2.2 "Focus Not Obscured").
- **Self-drawing lines would have broken on phones.** The web trick (pathLength) isn't supported by the phone's SVG library; the TypeScript check caught it. Fix: measure each line's real length and draw it with a dash of that length.
- **Gesture Handler 3 changed its API** (hooks like usePanGesture instead of Gesture.Pan()). Read the library's own type files and wrote the sheet with the new hooks.
- **Self-review fixes on the new Status screen:** "Normal" appeared twice (badge and big word), the water line was nearly invisible at Normal, the collapsing header was see-through, and gauge times wrapped onto two lines. All fixed before showing the screen.
- **The phone app couldn't find a library the shared code uses** (@turf/bbox-clip, which cuts warning areas into tiles for the router). The website has it installed one folder up, but Metro (the phone app's bundler) looks for packages starting from each file's own folder. Diagnosed with a test bundle (`npx expo export`), which named the missing package. Fix: installed it in /mobile and told Metro to also look in /mobile's packages for files in /shared.
- **An animation warning repeated in the phone log** ("writing to value during render"): the onboarding page dots started their animation while drawing. Fix: start it after drawing, in an effect.

- **The phone app wouldn't open in a browser preview** (to check the redesign before phone testing): the Map tab's map library has no web version. Fix: a tiny stand-in map used only for browser previews (`mobile/scripts/web-stubs/react-native-maps.js`, wired in `metro.config.js`); the phone always uses the real map.
- **Scrubbing the storm timeline flashed loading placeholders** between steps, because each step is a new "place + scenario" key. Fix: while moving between timeline steps of the same place, the screen keeps showing the current picture until the next step is ready (`useStatus.ts`).
- **React Compiler lint caught two things in the new code:** reading the clock while drawing (the alert time bar now uses the time the status loaded) and setting state inside an effect (the sky slots now update while rendering, React's own pattern for "a prop changed").

## Open questions for me

- ~~App name~~ Decided: **Highwater** (2026-10-18).
- ~~OpenRouteService hanging~~ Working again (tested 2026-10-18: a York County route came back in under 1 second). If it stops again, the app still works with the backup router (no hazard avoidance).
- **Your ORS key was pasted into the chat.** It's low risk (it only spends routing quota and is now stored safely in Cloudflare), but you can make a new key at account.heigit.org; then put it in `worker/.dev.vars` and I'll re-upload it.

## Later (ideas outside current scope)

- **Admin login:** create your user in Supabase (Authentication → Users → Add user, with a password you type), then run `supabase/make-admin.sql` with your email. The moderation page is at `#/admin` (not linked anywhere).
- Address search (needs the Cloudflare Worker, Phase 4).
- Alert popups on the map; tap a spot on the map to check it.
- **The district map page scores about 50 for Lighthouse performance** (the route page was fixed: 96; everything else 97–100). The cause is the map library itself (MapLibre, about 1 MB, ~1.1–1.5 s of setup on Lighthouse's slowed-down phone). Ideas: a lighter map library, or showing the map only after a tap.

## Manual test script

### Phase 0
1. Open the live URL on a phone and on a computer.
2. The page shows the header "Highwater", a blue "In development" note, a headline, four status levels, 8 counties, and a footer with "call 911".
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

### Phase 2
1. **Status:** York County loads with a status card (Normal today), "Why this status?", "What to do", rain forecast, alerts, and gauges.
2. **County picker:** choose Lancaster. Everything reloads for Lancaster. Its "Why this status?" says it has no gauges with official flood stages.
3. **ZIP:** type 29730 and Go. The heading becomes "ZIP 29730" in York County, with a FEMA flood zone and neighborhood facts. Type 90210: "isn't in the 8 SC-5 counties."
4. **Use my location:** allow it. Outside SC-5 you'll see a message; inside you'll see "Your location."
5. **Scenario Mode** (header button): pick each scenario.
   - Flood Watch → Watch (yellow, eye icon), rain 2.6 in.
   - River flood warning → Warning (orange, triangle), Catawba River near Rock Hill rising to 16.40 ft "Minor flooding."
   - Flash flood emergency → Danger (crimson, octagon), "damage threat: catastrophic."
   - Tornado warning (Lancaster) → Warning, tornado icon, "Stay where you are and take shelter," no route button.
   - A black "SIMULATION — not live data" banner is on every screen, and the card says "Simulated." "Turn off" returns to live data.
6. **District map:** the map shows tracts colored by vulnerability, county lines and names, gauges as shapes. Switch to Flood exposure and Priority; the legend changes. Click a tract: the detail panel shows each measure next to the SC-5 average. Uncheck "River gauges": they hide.
7. **Map text version:** below the map, "Counties at a glance" table and "Show all 149 tracts"; choosing a tract opens its panel.
8. **How it works:** shows the full methodology with tables. **About** shows the privacy note.
9. Turn off Wi-Fi and refresh the status: the card says "Can't confirm" with the reasons, not "Normal."

### Phase 3
1. **Get ready** (in the menu): 12 hazards, each with "Get ready" and "Act now" steps and official source links. "Print this page" shows a clean printout with no menus or buttons.
2. **Scenario Mode → Extreme heat warning (Cherokee):** Warning with a thermometer icon; steps mention air conditioning and "never leave people or pets in a closed car"; "If it gets worse" explains heat stroke; "Stay where you are and take shelter," no route button.
3. **Scenario Mode → Tropical storm (Kershaw):** Warning with the rain-and-wind icon; "Also active here: Flooding, Watch."
4. **Install:** on Android Chrome, the menu offers "Install app" or "Add to Home screen"; on iPhone Safari, Share → "Add to Home Screen." The icon is the blue water and gauge symbol.
5. **Offline:** open the app once with signal, then turn on airplane mode and reopen it. The app opens, a "You're offline" banner shows on every page, Get ready works, and the status shows "Offline: showing info from [time]" with "Can't confirm," never "Normal."

### Phase 4
1. **Scenario Mode → Flash flood emergency.** The status shows Danger and a **Plan a lower-exposure route** button.
2. Open it: the safety notice is at the top. "Nearest open shelter" says no shelters are open, with your county's emergency management link.
3. Start: type ZIP **29715** → "Start: ZIP 29715". The destination fills in: **Van Wyck (town center outside the warning area)**.
4. **Plan routes:** within about 25 seconds you see route cards (time, miles, minutes vs fastest, warning areas entered, miles inside warning areas, FEMA flood zones crossed), steps, and Google/Apple Maps links. If ORS is down, a red "This route does not avoid hazard areas" banner shows.
5. **Scenario Mode → Tornado warning (Lancaster)**, then go to the route page: it says "Stay where you are and take shelter" and shows no planner.
6. **Print or save these directions** prints the route cards with all steps.

### Phase 5
1. **Report a problem** (menu): choose a category; the map appears. Tap the map: "Location: … County." Add a note (try a phone number: you get a red message). Check "Verify you are human," then **Send report**: "Thanks. Your report is posted." with official links (SCDOT, county, utility).
2. Choose **Downed power line**: a full-screen notice says to stay at least 30 feet away, with Call 911 / Duke / Dominion buttons.
3. **Reports near you** lists the report with "Unverified," and Still there / Fixed / Flag. Tap "Still there" twice: the second says you already did that.
4. **District map:** "Community reports (unverified)" toggle shows report dots; click one for its category.
5. **Route planner:** route cards show "Unverified reports nearby"; "Avoid community-reported flooded roads" is checked by default.
6. **Scenario Mode on:** sending says "Saved in this tab (simulation)… Nothing was sent."
7. **#/admin** (after you're set up as admin): sign in, then Hide / Restore / Resolve reports.

### Phase 6
1. On a phone-width screen (360 px), the menu wraps onto two lines; nothing is cut off.
2. **How it works:** an "On this page" list at the top; tapping an item jumps to that section.
3. **About:** lists all eight limits, privacy for location, routes, and reports, and every data source.
4. Turn on airplane mode, then reload: the offline banner shows the last saved info. Turn it off: live data returns.
5. Paste the site link into a chat app: a preview card with "Highwater" appears (after deploy).
6. Keyboard only: Tab to "Report a problem", pick a category with Enter, type a ZIP and press Enter: the location is set.
