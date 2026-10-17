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
