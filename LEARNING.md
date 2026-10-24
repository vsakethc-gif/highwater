# Learning log

Evidence of my own work and a study guide for judging. Fill in "What I did" in your own words after each session.

## Session log

### Saturday, October 17, 2026: Phase 0 (setup)

**What I did** *(edit this in your own words)*
- Chose the problem and wrote the project brief (`CLAUDE.md`).
- Reviewed the Phase 0 plan, the color and font choices, and the placeholder page.
- Created my GitHub account login and approved the app's access, so the site could be published at https://vsakethc-gif.github.io/highwater/
- _Add: anything you tested, changed, or decided yourself._

**What was built**
- The project skeleton (folders, config, tooling), the design tokens, a placeholder page, the first tests, and automatic deployment to GitHub Pages.

### Saturday, October 17, 2026: Phase 1 (verify data, first live page)

**What I did** *(edit this in your own words)*
- Reviewed which data sources work, which don't, and the replacements (DATA_SOURCES.md).
- _Add: e.g. compared a gauge reading on the app with waterdata.usgs.gov, requested the Census API key._

**What was built**
- Every data source tested with real requests; results in DATA_SOURCES.md, saved samples in tests/fixtures.
- A script that builds the list of 39 active gauges in SC-5 and links them to official flood stages.
- The York County page with live alerts and river levels, with loading, empty, error, and stale states.

### Saturday, October 17, 2026: Phase 2 (engine, all 8 counties, map, Scenario Mode)

**What I did** *(edit this in your own words)*
- Got a Census API key and activated it.
- Decided to save explanations and quizzes for the end so the build could move faster.
- _Add: what you tested in Scenario Mode, what you noticed on the map, anything you'd change._

**What was built**
- Data scripts for county and tract outlines, Census population data, FEMA flood-zone shares, and ZIP codes.
- The hazard engine: an alert table for every NWS alert type, flood rules for gauges and rain, and the overall status.
- Vulnerability, exposure, and priority scores; guidance text; the status screen with county/ZIP/location choice.
- The district map, Scenario Mode with 4 scenarios, and the How it works and About pages.

### Saturday, October 17, 2026: Phase 3 (all hazards, offline, installable)

**What I did** *(edit this in your own words)*
- _Add: which scenarios you tried, whether you installed it on your phone, what you'd change in the guidance wording._

**What was built**
- Guidance for 9 more hazards from official sources; two new scenarios (extreme heat, tropical storm).
- A printable "Get ready" page with steps for every hazard.
- The app can be installed and opens offline; the last loaded data is shown, clearly labeled, when there's no signal.

### Sunday, October 18, 2026: Phase 4 (route planner and shelters)

**What I did** *(edit this in your own words)*
- Created the OpenRouteService (HeiGIT) and Cloudflare accounts and approved access.
- _Add: what you tried in the route planner and what you noticed._

**What was built**
- A Cloudflare Worker that keeps the routing key secret and handles address search.
- The lower-exposure route planner: shelters, "away from the warning area," route cards with a scoring formula, a backup router, and the shelter-in-place block.

### Sunday, October 18, 2026: Phase 5 (community reports)

**What I did** *(edit this in your own words)*
- Created the Supabase project, ran the database setup, and handled the secret key.
- Tested the report flow on the live site: worked through the failed human check with Claude, and sent the first real report.
- _Add: what you think of the categories and wording._

**What was built**
- A public reporting form with spam protection and no personal data, official "get it fixed" links, community votes, automatic expiry, a map layer, route warnings, and a private admin page.

### Sunday, October 18, 2026: Phase 6 (polish, accessibility, performance)

**What I did** *(edit this in your own words)*
- Chose the final name, Highwater.
- _Add: what you checked on your own phone, and anything that looked off to you._

**What was built**
- A design pass at 5 screen widths, honest error messages when each data source fails, a table of contents for How it works, a fuller About page, a link-preview image, and keyboard access for setting a report location.
- Lighthouse (mobile): accessibility 100 and best practices 100 on every page; performance 97–100 except the map (50) and route (76) pages, where the map library is the bottleneck.

### Sunday, October 18, 2026: Helene replay and speed

**What I did** *(edit this in your own words)*
- Chose which improvements to make (Helene replay, faster pages, deploy updates).
- _Add: what you noticed comparing the replay with what you remember from Helene._

**What was built**
- Two Scenario Mode replays of Hurricane Helene using real archived NWS alerts and USGS river readings.
- The route planner's map now loads only when needed; the route page went from 76 to 96 on Lighthouse.
- Refreshed the gauge list (still 39 gauges), and updated and pinned the deploy setup.

### Friday, October 23, 2026 (night): "Living Status" redesign of the phone Status screen

**What I did** *(edit this in your own words)*
- Wrote the redesign brief (REDESIGN.md): which apps to learn from and which pattern to take from each.
- _Add: what you noticed testing the storm timeline on your phone._

**What was built**
- The Status screen is now a living scene: its sky, water line, rain and glow change with the level.
- A storm timeline in Scenario Mode: drag it and the scene goes Normal → Watch → Warning → Danger.
- The hero shrinks into a compact bar as you scroll; pulling down lifts the water and refreshes.

## Concepts

### Lighthouse and layout shift
Lighthouse is Google's built-in page checker. It scores speed, accessibility, best practices, and search basics from 0 to 100, on a slowed-down pretend phone. "Layout shift" measures how much things jump around while a page loads. We fixed it by reserving space for content before it arrives.

### Media queries vs. container queries
A media query changes the layout based on the screen's width. A container query changes it based on the width of the box the element sits in. The river gauge list uses a container query, so it looks right both full-width on a phone and in the narrow side column on a laptop.

### Animation and reduced motion
CSS can animate an element from one state to another ("keyframes"). We only animate opacity (see-through) and transform (move or scale), because those don't push other things around. Some people get dizzy from motion, so phones have a "reduce motion" setting; our CSS checks it and turns every animation off.

### Elevation and tuning a rule with data
OpenRouteService can give the height of every point on a route. A "low dip" is where the road drops into a valley. Our first guess (20 ft) mostly found ordinary hills, so we tested three versions on real routes and checked each dip against FEMA's flood map. The 40-ft version matched creeks every time. Testing a rule against real data, instead of guessing, is how you know it works.

### React Native, Expo, and Expo Go
**React Native** lets you build a real phone app (real native buttons, lists, and maps, not a web page) using TypeScript. **Expo** is a set of tools and libraries on top of React Native that handles the hard parts (fonts, location, splash screen). **Expo Go** is a free app from the App Store and Google Play that can run our app straight from the computer by scanning a QR code, with no paid developer account and no app store.

### One brain, two apps
The rules (alert table, flood rules, guidance, scoring) live in `/shared`. The website and the phone app both use that same code, so they always give the same answer. Each app only plugs in how it loads files and saves things (browser storage vs. phone storage).

### UI thread vs. JavaScript thread
A phone app has a lane of work that draws the screen (UI thread) and a lane that runs app logic (JavaScript thread). Reanimated runs animations on the drawing lane, so they stay smooth even when the app is busy.

### Archives and replays
Government data services usually show what's happening now. Archives keep the past. USGS keeps every river reading, and Iowa State's mesonet keeps every NWS alert with each update. A replay picks one past minute, keeps only what was true then, and shifts the times so the app treats it as "now."

### Lazy loading
Download big pieces only when someone needs them. The route map library is about 300 KB compressed, so it loads when you tap "Show map" or get routes. The page opens much faster on a slow phone.

### Failure testing
To see what people get when a service is down, a test browser blocked one source at a time (weather alerts, river levels, the report database, map data). The rule: a failure must say "couldn't load," never look like "all clear."


### What is a web app made of?
- **HTML** is the structure (headings, paragraphs, links).
- **CSS** is the look (colors, fonts, spacing).
- **JavaScript** is the behavior. We write **TypeScript**, which is JavaScript plus "types": labels that say what kind of data each thing holds, so mistakes are caught before the code runs.

### npm and package.json
`package.json` lists the libraries (code other people wrote and shared) the app uses. `npm install` downloads them into `node_modules/`. We don't commit that folder, because anyone can re-download it.

### Vite (build tool)
During development, `npm run dev` shows the site on your computer and refreshes it when you save. `npm run build` packs everything into small, fast files in `dist/`, and those are what get published.

### Design tokens
Named values like `--color-accent` or `--space-2`, defined once in `tokens.css`. Everything else uses the names, so the design stays consistent and can be changed in one place.

### Contrast ratio (accessibility)
A number comparing how light text is versus its background, from 1:1 (invisible) to 21:1 (black on white). WCAG AA requires at least 4.5:1 for normal text and 3:1 for borders and icons. We measured every color pair.

### Feature flags
On/off switches in `config.ts`. An unfinished feature stays off, so it can't break the working app.

### Git, GitHub, and GitHub Pages
- **Git** saves snapshots ("commits") of the project, so you can see what changed and undo mistakes.
- **GitHub** stores those snapshots online.
- **GitHub Actions** runs a script on GitHub's computers every time you push: it runs the tests, builds the site, and publishes it.
- **GitHub Pages** hosts the published site for free.

### Automated tests
Small programs that check our code gives the right answers, for example "the overall status is the highest level among hazards." `npm test` runs them all in under a second.

### XSS (cross-site scripting)
An attack where someone sneaks code into text that a site displays. Our `h()` helper always inserts text as plain text, never as HTML, which blocks this.

### API
An **API** (Application Programming Interface) is a way for one program to ask another for data. We send a web address with our question in it (e.g. "gage height for these gauges, last 6 hours"), and the agency's server answers with data instead of a web page.

### JSON and GeoJSON
**JSON** is a plain-text format for data: `{"value": 5.11, "unit": "ft"}`. **GeoJSON** is JSON for map data: each "Feature" has properties plus a geometry (a point, line, or polygon) with longitude/latitude coordinates. USGS, NWS, and FEMA all answer in GeoJSON.

### CORS
A browser safety rule. A web page may read data from another website only if that site says "browsers may read me" (the `Access-Control-Allow-Origin` header). USGS, NWS, NOAA, and FEMA allow it; the Census Geocoder doesn't, so we need a helper (our Worker) for it.

### Parsing
Each agency formats data differently. A **parser** converts each one into our own simple shape (`Gauge`, `Alert`), so the rest of the app doesn't care where data came from. Parsers are tested on **fixtures**, real responses we saved, so we know they handle what agencies actually send.

### Provisional data
USGS live readings haven't been checked by a person yet and may be corrected later. We label them "provisional."

### VTEC codes
Every NWS warning carries a code like `/O.NEW.KGSP.FF.W.0024.../`. The part after `O.` says what the message does: **NEW**, **CON** (continues), **EXT** (extended), **CAN** (cancelled), **EXP** (expired). We drop CAN/EXP so a finished warning never raises a status.

### Flood stage
The water height at a gauge where NWS says flooding begins. NOAA defines four: **action** (get ready), **minor**, **moderate**, and **major** flooding. Small creeks often have none; we never make one up.

### Stale data
If a reading is more than 2 hours old, the gauge may be offline. We show it with a clear "old reading" note and never treat it as an all-clear.

### Rule-based engine
A set of fixed "if this, then that" rules written in code: "if a gauge is at minor flood stage, flooding is at Warning." The same inputs always give the same answer, and every answer lists its reasons ("triggers"). That's what makes it explainable, unlike a black box.

### Percentile rank
Where a value falls compared with all others, from 0 to 100. If a tract's share of older adults is higher than 80% of SC-5 tracts, its percentile rank is 80. We average four ranks to get the vulnerability score.

### Point in polygon
How the app knows if a spot is inside a county or a warning area: draw an imaginary line from the point to the right and count how many edges of the shape it crosses. Odd = inside, even = outside. (`src/lib/geo.ts`)

### Choropleth map
A map where areas are shaded by a number (darker = higher). Our tract layers are choropleths. We use 5 bands and a color scale that stays readable with color-blindness.

### Vector vs raster basemaps
A raster basemap is pictures (tiles) of the map. A vector basemap sends the shapes and the browser draws them, which is sharper and lets us style it. We use a vector basemap from OpenFreeMap, drawn by MapLibre.

### Lazy loading
Download code only when it's needed. The big map library loads only when you open the map, so the main screen stays small and fast on phones.

### Census tract
A small area Census uses for statistics, usually 1,200 to 8,000 people. SC-5's 8 counties have 149.

### Special Flood Hazard Area (SFHA)
FEMA's high-risk flood zone: land with about a 1% chance of flooding in any year (about 26% over a 30-year mortgage). Zones that start with A or V.

### Scenario Mode
Pretend data run through the real rules, so we can show what happens in a flood or tornado without waiting for one. Always labeled "SIMULATION — not live data."

### Progressive Web App (PWA)
A website that can be installed like an app: it gets a home-screen icon, opens full-screen, and can work offline. It needs a **manifest** (name, icon, colors) and a **service worker**.

### Service worker
A small script the browser keeps for one website. It sits between the app and the internet. Ours saves the app's own files when you first visit, then hands them back instantly, even with no signal. It never saves live government data; the app labels its own saved copy instead.

### Cache
A saved copy of something so it can be reused without downloading it again. "Cache-first" means use the saved copy if there is one; "network-first" means try the internet first and fall back to the saved copy.

### localStorage and sessionStorage
Small storage spaces inside your browser for this one website. localStorage keeps things until you clear it (we save your chosen county and the last loaded data). sessionStorage is cleared when the tab closes (we keep Scenario Mode there, so a demo never "sticks").

### Shelter in place
For some hazards (tornado, severe storm, extreme heat or cold, winter storm, high wind) going outside or driving is more dangerous than staying put. The app tells people to take shelter where they are and never offers a route out for those.

### Server-side secret (why we have a Worker)
Anything in a website's code can be read by anyone. A routing key in the browser could be copied and used up. So the key lives in a tiny program on Cloudflare (the **Worker**); the app asks the Worker, and the Worker adds the key before asking OpenRouteService.

### Avoid polygons
Shapes we ask the router to stay out of. They're "hard" rules: if every road is blocked, there's no route, so the app retries with fewer areas and says what it couldn't avoid.

### Timeouts and fallbacks
Free services are sometimes slow or down. A **timeout** means "stop waiting after N seconds." A **fallback** is the plan B: here, the OSRM backup router, clearly labeled because it can't avoid hazards.

### Rate limiting
Capping how many requests one visitor can make in a period (20 routes per 10 minutes), so nobody can use up the free quota.

### Database and SQL
A **database** stores rows in tables (like a spreadsheet with rules). **SQL** is the language for creating tables and rules. Our `schema.sql` creates the reports table and its security rules.

### Row Level Security (RLS)
Rules inside the database that decide which rows each kind of user can see or change. Our rule: the public may *read* active reports only; nobody can write directly. The Worker uses a secret key to save reports after checking them.

### Publishable vs. secret keys
The publishable key is meant to be public: it can only do what RLS allows. The secret key skips RLS, so it lives only in the Worker, never in the website.

### CAPTCHA / Turnstile
A check that a real person, not a bot, is using the page. Cloudflare Turnstile usually passes people automatically or with one click. The Worker double-checks each token with Cloudflare.

### Hashing
Turning text into a scrambled fingerprint that can't be turned back. We store a hash of a random device ID (mixed with a secret "salt"), so we can count reports per device without knowing whose device it is.

### The living scene (how the Status background animates)
The background is layers drawn in code: a color gradient (the "sky"), two wavy shapes (the water), thin lines (rain), and a soft red glow at Danger. Each moving part has a "shared value", a number that lives on the phone's UI thread, the lane of work that draws the screen. The water's height is one shared value from 0 (Normal) to 3 (Danger); the waves slide sideways by changing another. Because the UI thread moves them, the animation stays smooth even while the JavaScript thread is busy loading river data. When the storm timeline is dragged, the finger writes straight into the water's shared value, which is why the water follows the finger without lag.

### Crossfade
Showing two versions stacked and fading the top one in. The scene keeps two sky "slots" and always paints the new level into the hidden one before fading over, so colors never jump.

