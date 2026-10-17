# SC-5 Ready

A free, public, mobile-first web app that helps residents of South Carolina's 5th Congressional District understand hazards near them right now, know what to do, find a lower-exposure way out if they need to leave, and report broken or dangerous things in their community.

> This app is not an official warning system. Follow instructions from local officials. In an emergency, call 911.

Built for the 2026 Congressional App Challenge (SC-5) by a high school student in York County. AI assistance is disclosed in [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

**Live site:** https://vsakethc-gif.github.io/sc5-ready/

**Status:** Phase 2. Hazard status for all 8 counties, guidance, district map, and Scenario Mode.

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
```

## How the code is organized

| Folder | What lives there |
|---|---|
| `src/config.ts` | App name, county list, feature flags, thresholds: everything you might want to change |
| `src/styles/` | `tokens.css` (named colors, sizes, spacing), `base.css` (page defaults), `components.css` |
| `src/components/` | Reusable UI pieces (status badge, icons, ...) |
| `src/pages/` | One file per screen |
| `src/lib/hazards/` | The rule-based hazard engine (status levels and rules) |
| `src/lib/data/` | Code that calls public data sources and cleans up their responses |
| `src/lib/guidance/` | Plain-language "what to do" rules and text |
| `src/lib/routing/`, `src/lib/reports/` | Route planner and community reports (later phases) |
| `public/data/` | Pre-processed static data (Census, FEMA, boundaries) |
| `scripts/` | Scripts that download and prepare static data |
| `worker/` | The one small Cloudflare Worker (routing proxy, later phase) |
| `supabase/` | Database schema and security rules for reports (later phase) |
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
| [Lucide](https://lucide.dev/) | Open-source icon set | ISC |
| [Public Sans](https://public-sans.digital.gov/) (via Fontsource) | Main typeface, made by the U.S. government | OFL-1.1 |
| [Source Serif 4](https://github.com/adobe-fonts/source-serif) (via Fontsource) | Serif typeface for page headings | OFL-1.1 |
| [GitHub Pages](https://pages.github.com/) | Free hosting for the website | — |
| GitHub Actions | Builds and deploys the site automatically on every push | — |

## Data sources

Live: USGS Water Data API (river levels), National Weather Service API (alerts and rain forecast), FEMA National Flood Hazard Layer (flood zone at a point). Built into the app by scripts: NOAA National Water Prediction Service (flood stages), Census ACS 2020–2024 (population measures), Census boundary and ZIP files, FEMA flood zones (share of each tract). Full details, limits, and test results are in [DATA_SOURCES.md](DATA_SOURCES.md). How the app decides each status is explained in [METHODOLOGY.md](METHODOLOGY.md).
