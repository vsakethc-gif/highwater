# Highwater

A free, public, mobile-first web app that helps residents of South Carolina's 5th Congressional District understand hazards near them right now, know what to do, find a lower-exposure way out if they need to leave, and report broken or dangerous things in their community.

> This app is not an official warning system. Follow instructions from local officials. In an emergency, call 911.

Built for the 2026 Congressional App Challenge (SC-5) by a high school student in York County. AI assistance is disclosed in [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

**Live site:** https://vsakethc-gif.github.io/highwater/

**Status:** feature-complete for the 2026 submission (Phase 7). Submission drafts are in [SUBMISSION.md](SUBMISSION.md), and a full plain-English walkthrough is in [FINAL_SUMMARY.md](FINAL_SUMMARY.md).

## What it does

- **Status** for any of the 8 SC-5 counties, your location, or a ZIP code: Normal, Watch, Warning, or Danger, with "Why this status?" reasons and plain-language steps.
- **District map** of live river gauges, active warning areas, and who lives where (older adults, households without a car, poverty, disability) compared with FEMA flood zones.
- **Lower-exposure route planner** that steers around active flood and evacuation warning areas, to an open shelter or a nearby town. Turned off during tornado and other shelter-in-place warnings.
- **Community reports** (streetlight out, flooded road, downed tree...), public and unverified, with the official place to get each one fixed.
- **Get ready** checklists for 12 hazards, **offline** use as an installable app, and **Scenario Mode** for demos, including two replays of Hurricane Helene (Sept 2024) built entirely from real archived alerts and river readings.

Everything is free, there are no accounts, and the "analysis" is a set of written rules ([METHODOLOGY.md](METHODOLOGY.md)), not AI.

## Running it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install        # download the libraries listed in package.json
npm run dev        # start a local preview at http://localhost:5173
npm test           # run the automated tests
npm run build      # check types and build the final site into /dist
node scripts/build-gauges.mjs       # SC-5 gauge list + official flood stages (public/data/gauges.json)
node scripts/build-boundaries.mjs   # county + tract outlines (public/data/counties.geojson)
node scripts/build-tracts.mjs       # Census + FEMA numbers per tract (needs CENSUS_API_KEY in .env)
node scripts/build-zips.mjs         # ZIP code centers (public/data/zips.json)
node scripts/build-towns.mjs        # SC-5 town centers for "Away from the warning area"
node scripts/build-helene.mjs       # Hurricane Helene replays from archived USGS readings and NWS alerts
node scripts/build-icons.mjs        # app icons for installing on phones (public/icons)
```

## The Cloudflare Worker (`/worker`)

One small server function. It keeps the OpenRouteService key secret, proxies address search (the Census Geocoder blocks browsers), and checks and saves community reports and votes.

```bash
cd worker
npx wrangler login              # one time: connect to your Cloudflare account
npx wrangler secret bulk .dev.vars   # upload the secrets from the git-ignored .dev.vars file
npx wrangler deploy             # publish https://sc5-ready.sc5ready.workers.dev
```

## The database (`/supabase`)

Run `supabase/schema.sql` once in the Supabase SQL Editor. It creates the tables, security rules, and the two functions the Worker calls. `supabase/make-admin.sql` makes your account an admin for the private `#/admin` page. The Worker needs these secrets in `worker/.dev.vars` (git-ignored), uploaded with `npx wrangler secret bulk .dev.vars`: `ORS_API_KEY`, `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET`, `DEVICE_SALT`.

## How the code is organized

The app has **one shared brain and two front ends**: the rules and data code live in `/shared` and are used by both the website (`/src`) and the phone app (`/mobile`). Each front end plugs in how it loads files and saves things (`shared/platform.ts`).

| Folder | What lives there |
|---|---|
| `shared/config.ts` | App name, county list, feature flags, thresholds: everything you might want to change |
| `shared/hazards/` | The rule-based hazard engine (status levels, alert table, vulnerability scores) |
| `shared/data/` | Code that calls public data sources and cleans up their responses |
| `shared/guidance/` | Plain-language "what to do" rules and text |
| `shared/routing/` | Route planner: avoid areas, scoring, elevation, map links, destinations |
| `shared/reports/` | Community report categories, official links, and the database client |
| `shared/scenario/` | Scenario Mode: six made-up scenarios and two real-data Helene replays |
| `shared/platform.ts` | The "plug" each app fills in: how to load data files and save things |
| `src/` | The website: pages, components, styles, service worker (`src/sw/`), and its platform plug |
| `mobile/` | The phone app (React Native + Expo), for testing and the demo; not published |
| `public/data/` | Pre-processed static data (Census, FEMA, boundaries) |
| `scripts/` | Scripts that download and prepare static data |
| `worker/` | The one small Cloudflare Worker (routing, address search, reports) |
| `supabase/` | Database schema and security rules for reports |
| `.github/workflows/` | Automatic deploy on every push, and a keep-alive ping so the free database doesn't pause |
| `tests/` | Automated tests and saved real API responses (`fixtures/`) |

## Libraries and services

| Name | What it does for this app | License |
|---|---|---|
| [Vite](https://vitejs.dev/) | Runs the local preview and bundles the code into a fast website | MIT |
| [TypeScript](https://www.typescriptlang.org/) | JavaScript with types, which catches mistakes before the code runs | Apache-2.0 |
| [Vitest](https://vitest.dev/) | Runs the automated tests | MIT |
| [@types/geojson](https://www.npmjs.com/package/@types/geojson) | Type definitions for map data (GeoJSON) | MIT |
| [MapLibre GL JS](https://maplibre.org/) | Draws the interactive district map | BSD-3-Clause |
| [OpenFreeMap](https://openfreemap.org/) | Free basemap tiles ("Positron" style), map data © OpenStreetMap contributors | Free service; OSM data ODbL |
| [marked](https://marked.js.org/) | Turns METHODOLOGY.md into the "How it works" page | MIT |
| [mapshaper](https://github.com/mbloch/mapshaper) | Script-only: filters and simplifies Census boundary files | MPL-2.0 |
| [Turf.js](https://turfjs.org/) | Script-only: measures flood-zone overlap and finds ZIP counties | MIT |
| [fflate](https://github.com/101arrowz/fflate) | Script-only: unzips Census files | MIT |
| [resvg-js](https://github.com/yisibl/resvg-js) | Script-only: draws the PNG app icons from the SVG logo | MPL-2.0 |
| [Lucide](https://lucide.dev/) | Open-source icon set | ISC |
| [Public Sans](https://public-sans.digital.gov/) (via Fontsource) | Main typeface, made by the U.S. government | OFL-1.1 |
| [Source Serif 4](https://github.com/adobe-fonts/source-serif) (via Fontsource) | Serif typeface for page headings | OFL-1.1 |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Deploys the Cloudflare Worker | MIT/Apache-2.0 |
| [@turf/bbox-clip](https://turfjs.org/) | Cuts big warning areas into tiles the router accepts | MIT |
| [Cloudflare Workers](https://workers.cloudflare.com/) | Free hosting for the one small server function | — |
| [OpenRouteService](https://openrouteservice.org/) (HeiGIT) | Driving directions that can avoid areas | Free plan, key required |
| [OSRM demo server](https://project-osrm.org/) | Backup directions when ORS is down (no avoidance) | Light use only |
| [Supabase](https://supabase.com/) | Free Postgres database for community reports, with Row Level Security | Free plan |
| [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | Free "I'm human" check on the report form | Free plan |
| [GitHub Pages](https://pages.github.com/) | Free hosting for the website | — |
| GitHub Actions | Builds and deploys the site on every push; pings the database every 3 days so it stays awake | — |
| [U.S. Census Geocoder](https://geocoding.geo.census.gov/) | Turns a typed street address into a map point (through the Worker) | Free, no key |
| [FEMA Open Shelters](https://gis.fema.gov/) | Shelters that FEMA and the American Red Cross list as open | Free, no key |
| [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu/) (Iowa State University) | Archive of past NWS alerts, used to build the Helene replays | Free, no key |
| [puppeteer-core](https://pptr.dev/) and [Lighthouse](https://developer.chrome.com/docs/lighthouse) | Testing only (not in the repo): screenshots at 5 screen widths, keyboard tests, failure-state tests, and performance scores | Apache-2.0 |

## Data sources

Live: USGS Water Data API (river levels), National Weather Service API (alerts and rain forecast), FEMA National Flood Hazard Layer (flood zone at a point, flood zones crossed by a route), FEMA Open Shelters, community reports (Supabase). Built into the app by scripts: NOAA National Water Prediction Service (flood stages), Census ACS 2020–2024 (population measures), Census boundary and ZIP files, FEMA flood zones (share of each tract). Full details, limits, and test results are in [DATA_SOURCES.md](DATA_SOURCES.md). How the app decides each status is explained in [METHODOLOGY.md](METHODOLOGY.md).

## Quality checks (October 18, 2026)

- 159 automated tests pass (Unknown command: "test"


Did you mean this?
  npm test # Test a package
To see a list of supported npm commands, run:
  npm help).
- Lighthouse, mobile: **accessibility 100 and best practices 100 on every page.** Performance: Status 97, Report 100, Get ready 100, About 99, How it works 99, Route 96, District map 50. The district map page is slowed by the map library (MapLibre, about 1 MB); see NOTES.md.
- Checked at 360, 390, 768, 1024, and 1440 px wide with no sideways scrolling; keyboard-only use tested; each data source tested while blocked, to confirm the app says "couldn't load" instead of showing an all-clear.
