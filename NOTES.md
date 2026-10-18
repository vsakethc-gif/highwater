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
- **Scores are computed in the browser** from raw percentages, by tested code (`src/lib/hazards/vulnerability.ts`), not inside the data script. One place for the rule, and it's tested.
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

## Open questions for me

- ~~App name~~ Decided: **Highwater** (2026-10-18).
- ~~OpenRouteService hanging~~ Working again (tested 2026-10-18: a York County route came back in under 1 second). If it stops again, the app still works with the backup router (no hazard avoidance).
- **Your ORS key was pasted into the chat.** It's low risk (it only spends routing quota and is now stored safely in Cloudflare), but you can make a new key at account.heigit.org; then put it in `worker/.dev.vars` and I'll re-upload it.

## Later (ideas outside current scope)

- **Admin login:** create your user in Supabase (Authentication → Users → Add user, with a password you type), then run `supabase/make-admin.sql` with your email. The moderation page is at `#/admin` (not linked anywhere).
- Historical Hurricane Helene replay (late Sept 2024) for Scenario Mode, using archived USGS gauge data. Synthetic scenarios cover the demo for now.
- Address search (needs the Cloudflare Worker, Phase 4).
- Alert popups on the map; tap a spot on the map to check it.
- Re-run `node scripts/build-gauges.mjs` before submission, in case gauges went offline or came back.
- **Map and route pages score about 50 and 76 for Lighthouse performance** (everything else 97–100). The cause is the map library itself (MapLibre, about 1 MB, ~1.1–1.5 s of setup on Lighthouse's slowed-down phone). Ideas: a lighter map library, or showing the map only after a tap.
- Update the GitHub Actions versions in `deploy.yml`: GitHub warns that the current ones use Node 20, which is being retired. They still work today.

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
