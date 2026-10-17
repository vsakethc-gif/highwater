# SC-5 Ready

A free, public, mobile-first web app that helps residents of South Carolina's 5th Congressional District understand hazards near them right now, know what to do, find a lower-exposure way out if they need to leave, and report broken or dangerous things in their community.

> This app is not an official warning system. Follow instructions from local officials. In an emergency, call 911.

Built for the 2026 Congressional App Challenge (SC-5) by a high school student in York County. AI assistance is disclosed in [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

**Status:** Phase 0 (setup). Live data arrives in Phase 1.

## Running it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install        # download the libraries listed in package.json
npm run dev        # start a local preview at http://localhost:5173
npm test           # run the automated tests
npm run build      # check types and build the final site into /dist
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
| [Lucide](https://lucide.dev/) | Open-source icon set | ISC |
| [Public Sans](https://public-sans.digital.gov/) (via Fontsource) | Main typeface, made by the U.S. government | OFL-1.1 |
| [Source Serif 4](https://github.com/adobe-fonts/source-serif) (via Fontsource) | Serif typeface for page headings | OFL-1.1 |
| [GitHub Pages](https://pages.github.com/) | Free hosting for the website | — |
| GitHub Actions | Builds and deploys the site automatically on every push | — |

Data sources are listed in [DATA_SOURCES.md](DATA_SOURCES.md). How the app decides each status is explained in [METHODOLOGY.md](METHODOLOGY.md).
