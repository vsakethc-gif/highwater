# Learning log

Evidence of my own work and a study guide for judging. Fill in "What I did" in your own words after each session.

## Session log

### Saturday, October 17, 2026: Phase 0 (setup)

**What I did** *(edit this in your own words)*
- Chose the problem and wrote the project brief (`CLAUDE.md`).
- Reviewed the Phase 0 plan, the color and font choices, and the placeholder page.
- Created my GitHub account login and approved the app's access, so the site could be published at https://vsakethc-gif.github.io/sc5-ready/
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

## Concepts

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
