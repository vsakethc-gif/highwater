# PROJECT BRIEF: SC-5 Hazard Readiness App (working title: "SC-5 Ready")

Read this ENTIRE file before doing anything. It is the source of truth for the project. When something here conflicts with a quick assumption of yours, this file wins. When something is unclear, make the most reasonable choice, record it in `NOTES.md` under "Assumptions", and keep moving. The name "SC-5 Ready" is a placeholder; keep the name in one config constant (`APP_NAME`) so I can change it in one place.

---

## 0. Who I am, what this is, and the clock

I am a high school student in York County, South Carolina, entering the **Congressional App Challenge** for South Carolina's 5th Congressional District (SC-5). The deadline is **Monday, October 26, 2026**. I will submit on **Sunday, October 25**. Today's build starts **Saturday, October 17**. That is about 8 days, with big blocks of time only on weekends and Friday, and short sessions on weekdays.

I have no coding background. Therefore:
- Explain what you are doing in plain, simple language as you go. I must be able to describe how every part works, in my own words, in a demo video and a written submission.
- When you make a design or technical decision, give me one or two sentences on why.
- Keep `NOTES.md` current (section 18). The "Problems and fixes" section becomes my answer to "What technical challenge did you face and how did you solve it?"

### 0.1 Competition AI rules: this changes how you work with me
The Congressional App Challenge rules (2025 version; I will confirm the 2026 version) say AI tools are allowed only if **fully disclosed**, AI **cannot make up the entire technical development**, and I must show **significant individual contributions and real understanding** of my app. Judges may ask to see the source code and app to verify. So:
- **You write the code, and you explain every part.** After you finish each part (each module, data source, screen, or feature), explain in plain language what it does, how it works, why it was built that way, and how it connects to the rest of the app. Keep the code simple enough that I can walk a judge through it.
- **Keep `LEARNING.md`:** a dated log of what I personally did each session (code I wrote, decisions I made, data I verified, bugs I found), plus short explanations of each major concept (APIs, JSON, GeoJSON, CORS, Row Level Security, polygons). This is evidence of my contribution and my study guide.
- **Quiz me** briefly at the end of each phase with 3 questions about how that part works, so I can answer a judge.
- Every open-source library and external service must be listed in the README with what it does.

Because time is short, **scope is tiered (section 3). Ship the P0 core polished before touching P1. Never leave the app in a broken state at the end of a session.**

---

## 1. The product in one paragraph

A free, public, mobile-first web app that helps everyday residents of SC-5 **understand hazards near them right now, know what to do, find a lower-risk way out if they need to leave, and report broken or dangerous things in their community.** It combines real, public data: live river and stream levels (USGS), official National Weather Service alerts for every hazard type (floods, tornadoes, severe storms, tropical storms, winter weather, extreme heat, high wind and more), rain forecasts, FEMA flood zones, Census data on who lives where (older adults, households without a car, poverty), open shelters, and community reports. A transparent, rule-based engine turns all of that into a clear status for the person's location, plain-language guidance, a district map, and a route planner that steers away from active danger areas. Every number traces back to its source.

It is **not** an official warning system, does not predict disasters, and never tells anyone they are "safe." It says this clearly and always points to official sources and 911.

**SC-5 counties** (verify FIPS codes against Census data before relying on them):
- Cherokee 45021, Chester 45023, Fairfield 45039, Kershaw 45055, Lancaster 45057, Lee 45061, Union 45087, York 45091
- Parts of Spartanburg (45083) and Sumter (45085) are also in SC-5. These are **stretch only**. Do not include them unless everything else is done and polished.

---

## 2. Hard constraints

1. **Everything is free.** No paid APIs, hosting, or services. Free tiers are fine. Record each free-tier limit in `DATA_SOURCES.md`.
2. **No live AI/LLM calls from the app.** The "analysis" is a documented, rule-based scoring and guidance engine (sections 7 to 9). Describe it honestly as transparent rule-based analysis. No chat boxes, no "AI-powered" marketing, no sparkle icons.
3. **Hosting:** a static frontend on GitHub Pages (or Cloudflare Pages / Netlify free tier). Exactly two small free backend pieces are allowed, and only for the features that truly need them:
   - **Supabase (free tier)** as the database for community reports (section 11).
   - **One Cloudflare Worker (free tier)** used only as a thin proxy to hide the routing API key and, if needed, to fetch sources the browser cannot call directly. No other server code.
   - If a live source cannot be called from the browser, the alternative is a scheduled **GitHub Action** that fetches data and commits compact JSON to `/public/data/live/`.
4. **Secrets:** API keys (Census, OpenRouteService, AirNow, NASA FIRMS, etc.) are used only at build/fetch time or inside the Worker, via environment variables / GitHub Secrets / Worker secrets. Never commit a key. Never ship a secret key to the browser. (The Supabase *anon* key is designed to be public; security for it comes from Row Level Security, section 11.5.)
5. **No fake live data.** If a source fails, show an honest error or stale state. Simulated data is allowed ONLY in the clearly labeled Scenario Mode (section 12.8).
6. **Privacy:** a person's location is processed in their browser and sent only to the public APIs strictly needed to answer their request (for example, the routing API). Never log or store anyone's location or identity. Community reports collect **no name, email, phone, or account** from the public. Add a short plain-language privacy note.
7. **Safety language:** never say or imply a place or route is "safe." Use phrases such as "no active alerts reported right now," "lower-exposure route," and "avoids active warning areas we know about." Every guidance and routing screen links to 911, NWS, and official emergency management.
8. **Accessibility is a requirement** (section 14).
9. **Readable code.** The source code is part of my submission. Keep it organized, commented where logic is non-obvious, and documented in the README.

---

## 3. Scope tiers (build strictly in this order)

**P0: must ship, fully polished.**
- Flood hazard: live USGS gauges, NWS flood alerts, flood stages, rain forecast, FEMA flood zones.
- Location selection (county picker, "use my location", ZIP/address search if reliable).
- Status card with the four levels, "why this status", and guidance.
- District map with gauges, alert areas, and the vulnerability layer.
- Scenario Mode for demoing Warning and Danger.
- Methodology and About pages. Deployed on a live URL.

**P1a: multi-hazard + offline.** Extend the engine to all NWS alert types (section 7.3). This is cheap because the NWS alerts feed already covers every hazard; it mostly needs mapping tables, icons, and guidance copy. Also make the app an installable PWA with a service worker that caches the app shell, all guidance and checklists, and the last loaded status, so it still opens and shows "what to do" when cell service is weak during a disaster (clearly labeled "Offline: showing info from [time]").

**P1b: evacuation and lower-exposure route map** (section 10), including open shelters.

**P1c: community issue reporting** (section 11).

**P2: extras, only if all of the above is polished.** Air quality (AirNow), recent earthquakes (USGS feed; Kershaw County has had real earthquake activity), wildfire hotspots (NASA FIRMS), report photos, dark mode, Spartanburg/Sumter parts.

**Cut rule:** if by end of Wednesday 10/21 P1b or P1c is not working end to end, stop it, hide it behind a feature flag, and spend the time polishing what works. A smaller polished app beats a bigger broken one. Tell me before cutting.

All P1/P2 features must sit behind simple feature flags in one config file so any of them can be switched off without breaking the app.

---

## 4. Tech stack (decide quickly, then commit)

Recommended unless you have a strong reason otherwise (tell me why first):
- **Frontend:** Vite + TypeScript. Plain TypeScript modules with a small component structure, or minimal React. No heavy UI kit.
- **Map:** MapLibre GL JS or Leaflet, with a free, light, low-contrast basemap appropriate for data overlays. Check the tile provider's terms and attribution requirements, and comply. Show required attribution.
- **Styling:** hand-written CSS with design tokens (CSS custom properties). No Tailwind-default look.
- **Icons:** one open-source set (Lucide or Phosphor), one consistent stroke weight. Never emoji as icons. Each hazard type gets one distinct icon.
- **Backend pieces:** Supabase (Postgres + Row Level Security) for reports; one Cloudflare Worker for the routing proxy.
- **Anti-spam:** Cloudflare Turnstile (free) on the report form, verified in the Worker or a Supabase Edge Function.
- **Scripts:** Node or Python in `/scripts` for data fetching and preprocessing (run locally and by GitHub Actions). Use mapshaper or equivalent for simplifying geometries.
- **Tests:** Vitest for all engine logic, parsers, and routing helpers.

Folder structure (adapt if needed, but keep it this clean):
```
/src
  /components      UI components
  /pages           Status, Map, Route, Report, Methodology, About, 404
  /lib
    /hazards       one module per hazard + shared engine
    /data          API clients and parsers
    /routing       route request, scoring, avoid-area building
    /reports       Supabase client and report helpers
    /guidance      guidance rules and copy
  /styles          tokens.css, base.css, components.css
  config.ts        APP_NAME, feature flags, county list, thresholds
/public/data       generated static JSON/GeoJSON (+ /live if using Actions)
/scripts           fetch + build scripts
/worker            Cloudflare Worker (routing proxy, turnstile check)
/supabase          SQL schema, RLS policies, seed (no secrets)
/tests             unit tests + /fixtures with real trimmed responses
/.github/workflows deploy + scheduled data refresh
README.md  METHODOLOGY.md  NOTES.md  DATA_SOURCES.md  AI_DISCLOSURE.md  SUBMISSION.md
```

---

## 5. Data sources: VERIFY EVERY ONE WITH A REAL CALL BEFORE BUILDING ON IT

The endpoints below are my best knowledge and may have changed. For each source: read the current official docs, make a real request, save a trimmed real response to `/tests/fixtures/`, and record in `DATA_SOURCES.md` the exact working URL, parameters, auth, CORS behavior (does it work from a browser?), rate limits, update frequency, license/attribution, and quirks. If a source does not work as described, find the current official equivalent and tell me. Never build on an unverified source.

### 5.1 Live hazard data
1. **USGS real-time gauges.** Instantaneous values (`waterservices.usgs.gov/nwis/iv`), keyless; query by county (`countyCd`), parameters 00065 (gage height, ft) and 00060 (discharge, cfs), active sites only; plus site metadata. USGS is moving to newer APIs (`api.waterdata.usgs.gov`): check which is current and stable, use it, keep the other as fallback if it still works. Real-time USGS data is **provisional**; label it so wherever shown.
2. **NWS / NWPS flood stages.** NOAA's National Water Prediction Service API gives flood categories (action, minor, moderate, major) and thresholds for NWS river gauges. Work out how to map USGS site IDs to NWS gauge IDs. For gauges with no official flood stage, **do not invent thresholds**: show the reading compared with its own recent range and label "no official flood stage."
3. **NWS alerts, all hazard types.** `api.weather.gov/alerts/active?area=SC`. Match alerts to counties using the alert geocodes (UGC zone/county codes and SAME/FIPS). Keep alert polygons where provided (needed for routing). NWS asks for a descriptive `User-Agent`; browsers may not allow setting it, so test from the browser and fall back to the Worker or a scheduled Action if needed.
4. **NWS forecast rainfall.** `api.weather.gov/points/{lat},{lon}` → gridpoint data → quantitative precipitation forecast; sum next 24 and 48 hours. Verify units and response shape.

### 5.2 Static data (fetched by scripts, refreshed rarely, committed to `/public/data`)
5. **FEMA National Flood Hazard Layer (NFHL)** public ArcGIS REST service. Find the current "Flood Hazard Zones" layer (layer IDs change). Uses: (a) point lookup for a person's location (zone A, AE, AO, X shaded, etc.); (b) per-tract share of area in the Special Flood Hazard Area (precomputed); (c) counting how many times a candidate route crosses flood-zone areas (section 10). If point lookup can't run from the browser, precompute and state the limitation ("tract-level exposure, not a property-level determination").
6. **Census ACS 5-year (latest vintage), tract level, SC-5 counties.** Verify exact variable codes: total population; age 65+ (sum the relevant B01001 cells); households with no vehicle (B25044); population below poverty (B17001); optionally disability (B18101). Free Census API key at fetch time only.
7. **Census boundaries** (TIGER/Line or cartographic boundary files) for SC tracts and counties, simplified so all GeoJSON for the main view stays to a few MB total.
8. **Geocoding.** U.S. Census Geocoder (free) for address/ZIP search if it works from the browser or via the Worker. Otherwise offer "use my location," county picker, and click on map. Fewer input methods done reliably beat many done badly.

### 5.3 Routing and shelters (P1b)
9. **Routing: OpenRouteService (ORS) Directions API**, free tier with API key. Key feature: `options.avoid_polygons` (a GeoJSON Polygon/MultiPolygon to route around), and `alternative_routes`. Call it ONLY through the Cloudflare Worker so the key stays secret; add simple per-IP rate limiting in the Worker. Verify the free-tier daily/minute limits and the maximum size/complexity of avoid polygons; simplify polygons to fit.
   - Fallback if ORS fails or limits are hit: the public OSRM demo server returns a basic route without avoidance. If used, clearly label "This route does not account for active hazards." Check and follow the OSRM demo server's usage policy (it is not for heavy use).
10. **Open shelters.** FEMA / American Red Cross National Shelter System open-shelters data (public ArcGIS layer on FEMA's GIS site; verify current URL). Filter to SC-5 and nearby. If no shelters are open, say so honestly and link each county's emergency management page for official shelter info. Never list a shelter as open unless the data says it is open, and always show the data timestamp.
11. **Road closures (optional, verify):** check whether SCDOT / SC 511 publishes a free public feed of closures or incidents. If yes and usable, add closures as avoid areas. If not, skip and say so in the limitations.

### 5.4 Community reports backend (P1c)
12. **Supabase free tier.** Postgres table + RLS + optional Edge Function. Verify current free-tier limits, including that inactive free projects may pause, and document how to un-pause before the demo.
13. **Cloudflare Turnstile** for spam protection on the report form.

### 5.5 P2 extras (only if time allows)
14. **AirNow API** (free key) for current AQI.
15. **USGS earthquake GeoJSON feeds** (keyless) filtered to the SC-5 area.
16. **NASA FIRMS** (free map key) for active fire detections near SC-5.

### 5.6 Refresh architecture
- Static data: built by scripts, committed to `/public/data`.
- Live data: fetched from the browser where possible; otherwise via the Worker or a scheduled GitHub Action (every 15 to 30 minutes) writing `/public/data/live/*.json`.
- Every live panel shows "Updated [relative time] · Source: [name]".
- **Staleness:** if live data is older than 2 hours, show a visible stale warning and never present an "all clear" based on stale data.

---

## 6. Data model (simple and explicit; define TypeScript types for all of these)

- **Tract:** `geoid`, `county_fips`, `population`, `pct_65plus`, `pct_no_vehicle`, `pct_poverty`, (`pct_disability`), `pct_sfha`, `vulnerability_score` (0 to 100 or null), `exposure_score` (0 to 100), `data_quality` flag.
- **Gauge:** `site_id`, `nws_id` (nullable), `name`, `lat`, `lon`, `county_fips`, `latest_value`, `unit`, `timestamp`, `trend` (rising / falling / steady over ~3 h), `recent_series[]` (for sparkline), `flood_category` (null / action / minor / moderate / major), `has_official_stage`, `provisional: true`.
- **Alert:** `id`, `event` (NWS event name), `hazard` (our hazard type), `severity`, `urgency`, `certainty`, `headline`, `description`, `instruction`, `onset`, `ends`, `county_fips[]`, `geometry` (nullable), `url` (official alert link).
- **HazardStatus (per county and per point):** `hazard`, `level` (0 Normal, 1 Watch, 2 Warning, 3 Danger), `triggers[]` (human-readable reasons with source links), `updated_at`.
- **OverallStatus:** highest level across hazards + the list of active hazards sorted by level.
- **Shelter:** `id`, `name`, `address`, `lat`, `lon`, `status`, `capacity` (if given), `pet_friendly` (if given), `updated_at`, `source`.
- **Report:** see section 11.3.
- **RouteResult:** `geometry`, `duration_s`, `distance_m`, `avoided_areas[]`, `flood_zone_crossings`, `alert_area_intersections`, `nearby_unverified_reports`, `warnings[]`, `provider` (ors / osrm-fallback).

---

## 7. The hazard engine (the core of the "analysis")

All engine code is pure, tested functions in `/src/lib/hazards`, documented in `METHODOLOGY.md` in plain English with exact rules and thresholds. Transparency is a feature: every status must be explainable by listing its triggers.

### 7.1 Shared structure
Every hazard is a module implementing the same interface, for example:
```ts
interface HazardModule {
  id: HazardId;              // 'flood' | 'tornado' | 'severe_storm' | ...
  label: string;             // "Flooding"
  icon: IconName;
  evaluate(inputs: HazardInputs, place: Place): HazardStatus; // level + triggers
  guidance(status: HazardStatus, ctx: PlaceContext): GuidanceBlock;
}
```
The overall status for a place is the highest level among all hazards. The UI shows the top hazard as the hero and lists any others below it.

### 7.2 Status levels (same four levels for every hazard)
| Level | Name | Meaning in plain words |
|---|---|---|
| 0 | Normal | No active official alerts for this hazard here right now |
| 1 | Watch | Conditions could develop; get ready |
| 2 | Warning | It is happening or about to; act now |
| 3 | Danger | Life-threatening, extreme, or emergency-level alert |

Each level always has an icon + text label + color. Never color alone.

### 7.3 Mapping NWS alert events to hazards and levels
Build a mapping table in code (and show it in METHODOLOGY). Starting point (verify exact NWS event names against real data and the NWS event list; add any missing ones you see in SC):

| Hazard | Watch (1) | Warning (2) | Danger (3) |
|---|---|---|---|
| Flood | Flood Watch, Flash Flood Watch, Flood Advisory, Hydrologic Outlook (if relevant) | Flood Warning, Flash Flood Warning | Flash Flood Emergency; Flash Flood Warning with "considerable"/"catastrophic" damage threat tag |
| Tornado | Tornado Watch | Tornado Warning | Tornado Emergency; Tornado Warning with "considerable"/"catastrophic" tag or "PDS" wording |
| Severe storm | Severe Thunderstorm Watch, Special Weather Statement (storm-related) | Severe Thunderstorm Warning | Severe Thunderstorm Warning with "destructive" damage threat tag |
| Tropical / hurricane | Tropical Storm Watch, Hurricane Watch, Storm Surge Watch (only if it applies) | Tropical Storm Warning, Hurricane Warning | Extreme Wind Warning; Hurricane Warning with major-hurricane wording |
| Winter / ice | Winter Storm Watch, Winter Weather Advisory | Winter Storm Warning, Ice Storm Warning | Blizzard Warning |
| Extreme heat | Heat Advisory | Excessive Heat Warning / Extreme Heat Warning (verify current naming) | (top tier per current NWS naming) |
| Extreme cold | Cold Weather Advisory | Extreme Cold Warning (verify current naming) | — |
| Wind | Wind Advisory, High Wind Watch | High Wind Warning | — |
| Fire weather | Fire Weather Watch | Red Flag Warning | — |
| Fog / other | Dense Fog Advisory | — | — |
| Air quality | Air Quality Alert | — | — |

Notes: NWS has been renaming some heat and cold products; use the names present in real current data and keep old names as aliases. Damage threat tags live in alert parameters; parse them if present. Anything unrecognized goes to a generic "Other alert" hazard at Watch level, still shown with the official text and link.

### 7.4 Flood-specific rules (on top of alerts)
- Watch if: any official gauge in the county is at action stage, OR forecast rain ≥ a documented threshold (start with 2 inches in 24 hours; document and cite your reasoning).
- Warning if: any official gauge is at minor flood or above.
- Danger if: any official gauge is at moderate or major flood.
- Gauges without official stages never raise the level on their own; they are shown as context only.

### 7.5 Vulnerability, exposure and priority (for the map)
- **Vulnerability score per tract:** percentile rank (within SC-5 tracts) of `pct_65plus`, `pct_no_vehicle`, `pct_poverty` (and disability if used); score = mean of percentiles × 100. Exclude tracts with tiny or zero population and label them "insufficient data." Explain in METHODOLOGY that ACS estimates for small areas carry margins of error.
- **Flood exposure score per tract:** based on `pct_sfha`; choose and document the scaling.
- **Priority layer:** combines current hazard level, exposure, and vulnerability to answer: "If this hazard hits, where are the people with the fewest resources most exposed?" Always let the user see the separate components in the tract panel; never show a single combined number without its parts.

---

## 8. Limitations the app must state openly

Show these on the Methodology and About pages, and the relevant ones next to the feature they affect:
- Not an official warning system; it can be late, wrong, or missing alerts. Official NWS alerts, local officials, and 911 come first.
- Live gauge data is provisional and some gauges go offline; many small creeks have no gauge at all.
- FEMA flood zones show long-term risk, not where it is flooding today, and some maps are years old.
- Census figures are estimates with margins of error, especially for small tracts.
- Routes cannot see every closed or flooded road, and free-tier routing can be unavailable or rate-limited.
- Shelter information is only as current as the source data; always confirm with county emergency management.
- Community reports are unverified, can be wrong, and are not sent to any government agency.

---

## 9. Guidance engine

Rule-based text in `/src/lib/guidance`, written at about an 8th grade reading level, calm, specific, active voice. Base content on official guidance from Ready.gov, the National Weather Service, the Red Cross, and SC Emergency Management Division; cite the source link for each hazard's guidance in METHODOLOGY. Do not invent medical or technical advice.

For each hazard and level provide: **What's happening** (one sentence built from the actual triggers), **Do this now** (3 to 6 bullets), **If it gets worse**, **Check on others** (especially older neighbors and people without cars; strengthen this line when the area's vulnerability is high), and **Official links**.

Context rules, for example:
- In a FEMA flood zone + flood Watch or higher → emphasize preparing to leave and knowing the route.
- High share of households without a car in the area → mention asking neighbors or local officials about transportation help.
- Tornado Warning → shelter in place (lowest floor, interior room, away from windows); do NOT suggest driving away or routing out.
- Any flood level → always include "Turn around, don't drown: never walk or drive through floodwater."
- Downed power lines anywhere → stay far away, call 911 and the utility.

**Important:** for some hazards, leaving is the wrong advice (tornado, severe thunderstorm, extreme cold, often heat). The route planner (section 10) must only be suggested where leaving can make sense (flood, tropical storm/hurricane when officials order evacuation, wildfire, or other official evacuation orders). For shelter-in-place hazards, show "Stay where you are and take shelter" guidance instead of a route button.

Every guidance block ends with: "This app is not an official warning system. Follow instructions from local officials. In an emergency, call 911."

---

## 10. Evacuation and lower-exposure route map (P1b)

Goal: help someone see a way out that avoids the danger areas we know about, and find where to go. Be extremely careful with wording and claims here.

### 10.1 What the user does
1. Start point: "use my location", search, or tap the map.
2. Destination options:
   - Nearest **open shelter** (from 5.3, with status and timestamp), or
   - A place they choose (address search or tap), or
   - "Away from the warning area": the nearest reasonable point outside active warning polygons (document how you compute this, for example the closest town center or major road junction outside the polygon).
3. The app shows **up to three routes on the map:** the fastest route, and a lower-exposure route that avoids active alert areas, plus an alternative if available. Each route card shows: travel time, distance, extra minutes compared with fastest, number of FEMA flood-zone crossings, whether it passes through any active alert area, and any nearby unverified community reports (for example "flooded road" reports within 100 m of the route).
4. Turn-by-turn steps in a readable list, plus "Open in Google Maps / Apple Maps" handoff links with the same start and end (note in the UI that those apps will not avoid our hazard areas).
5. A print/save-friendly version of the route.

### 10.2 How the routing works
- Build an **avoid area** from: active Warning/Danger alert polygons for leave-able hazards (flood, flash flood, tropical, wildfire, evacuation orders); optional verified road closures; and small buffers around **recent flooded-road community reports** (only if the user switches on "Avoid community-reported flooded roads", default on, with a note that these are unverified).
- Do NOT simply avoid all FEMA flood zones: almost every creek crossing is inside one and routing would fail. Instead, count flood-zone crossings per route and use that as a scoring factor and a warning.
- Request routes from ORS through the Worker with `avoid_polygons` and alternatives. Simplify and size-check polygons first. If the avoided request fails (for example too complex or no path), retry with fewer avoid areas and tell the user which areas could not be avoided.
- Score routes with a documented, transparent formula (for example travel time plus penalties for alert-area intersections and flood-zone crossings) and explain it in METHODOLOGY.
- If ORS is unavailable, fall back to OSRM with a clear banner: "This route does not avoid hazard areas."

### 10.3 Mandatory safety framing on the route screen
- Title wording: "Lower-exposure route", never "safe route."
- Persistent notice: "Routes can't see every closed or flooded road. Never drive through water. If officials give evacuation directions, follow theirs instead. Call 911 if you are in danger."
- For shelter-in-place hazards (tornado, severe storm, extreme cold), hide the route planner and show shelter-in-place guidance.
- Show data timestamps for alerts, shelters, and reports used in the route.

---

## 11. Community issue reporting (P1c)

Goal: let residents report broken or dangerous things (a streetlight out, a downed tree, a flooded road) so neighbors can see them, and point people to the official channel that can actually fix them.

### 11.1 Report categories
Streetlight out · Traffic signal out · Downed tree or debris on road · Flooded road · Blocked storm drain · Pothole or road damage · Damaged or missing sign · Downed power line · Other.

**Emergency interception:** choosing "Downed power line" (or any category the user flags as an emergency) first shows a full-screen notice: "Stay at least 35 feet away. Call 911 and your power company now." (verify the distance guidance against official utility/safety sources and cite it), with tap-to-call buttons. Submitting to the app is secondary and optional.

### 11.2 The report flow (under 30 seconds, mobile-first)
1. Pick category (large tap targets with icons).
2. Confirm location: GPS pin (draggable) or tap on map; show the nearest street/place name if available.
3. Optional short description (max 280 characters) with the hint "Don't include names, phone numbers, or other personal info."
4. Turnstile check, then submit.
5. Confirmation screen: "Thanks. Your report is visible to others as unverified. This app does NOT send reports to the county or city. To get it fixed, also report it here:" followed by the correct official channel for that county and category (county public works, city 311 or service request pages, SCDOT maintenance requests for state roads, the power company for streetlights and outages). **Verify every official link and list them in `DATA_SOURCES.md`. If you can't verify one, don't show it.**

Photos are **P2 only.** If added: compress client-side, strip EXIF/location metadata, size cap, and moderate before showing.

### 11.3 Report data (Supabase table `reports`)
`id` (uuid), `category`, `lat`, `lon` (rounded to about 5 decimal places), `county_fips` (derived), `description` (nullable, trimmed, max 280), `created_at`, `status` (`active` | `hidden` | `resolved` | `expired`), `confirm_count`, `resolved_votes`, `flag_count`. **No personal data. No IP addresses stored.**

### 11.4 Community signals
- Others can tap **"Still there"** (confirm) or **"Fixed"**. A report showing enough "Fixed" votes (documented threshold) is marked resolved.
- **"Flag as inappropriate"**: auto-hide after a documented number of flags, pending review.
- Reports auto-expire (for example flooded-road reports after 48 hours; others after 30 days) unless re-confirmed. Document the rules.
- Map layer "Community reports" with category icons and an "Unverified" label. A list view sorted by distance with filters.

### 11.5 Security and abuse protection
- Row Level Security: the public can INSERT only through a controlled path (an Edge Function or the Worker that validates input and checks Turnstile), can SELECT only `active` reports and only non-sensitive columns, and can never UPDATE or DELETE directly. Confirm/fixed/flag votes go through a validated function with basic per-device throttling (for example a random device ID stored locally, not tied to identity).
- Server-side validation: category in the allowed list, coordinates inside the SC-5 bounding area (with a small buffer), description length, and a profanity/PII filter (strip or reject things that look like phone numbers and emails).
- Rate limit submissions (for example a few per device per hour).
- **Admin view** (for me only): Supabase Auth login, a simple page to hide, restore, or resolve reports. Not linked publicly.
- Never render report text as HTML (prevent XSS).

---

## 12. Screens and features

12.1 **Home / Status (mobile-first).** Location selector at top. Hero status card: overall level, top hazard, plain headline, "updated" time. Then: active hazards list, "Why this status?" (expandable triggers with sources), guidance, nearby gauges with sparklines, rain forecast, quick actions ("Plan a route out" only where leaving makes sense, "Report a problem", "Open district map").

12.2 **District map.** Full-bleed map of SC-5 with toggleable layers: active alert areas (by hazard), live gauges (colored by flood category, with shape/icon differences), vulnerability, flood exposure, priority, open shelters, community reports. A complete legend. Tap a tract for the detail panel (population, each vulnerability measure next to the SC-5 average, flood-zone share, plain-language meanings). County outlines always readable.

12.3 **Route planner** (section 10).

12.4 **Report a problem** (section 11) plus a "Reports near me" list.

12.5 **Location check.** "What's going on at my location": flood zone at that point (if technically possible), nearest gauges, alerts covering that point, nearest open shelter, nearby reports.

12.6 **Methodology.** Rendered from `METHODOLOGY.md`: every rule, mapping table, threshold, formula, data source, refresh time, and limitation, plus "This is not an official warning system."

12.7 **About.** What it is, who built it (a student in SC-5), why, the Congressional App Challenge note, what the app can't do, data credits, privacy note.

12.8 **Scenario Mode** (essential for the demo). A clearly labeled toggle that replays a SIMULATION: ideally a real past event from historical data (for example Hurricane Helene, late September 2024, using historical USGS gauge data for SC-5 rivers), plus synthetic scenarios defined in fixture files to demonstrate each hazard type (a tornado warning, a flash flood emergency, a heat warning). While active, a persistent banner on every screen reads **"SIMULATION — not live data"**, the status card shows a "Simulated" tag, and routes and reports in this mode are local-only and never written to the database.

12.9 **States everywhere:** loading (skeletons), empty ("No active alerts for York County right now"), error (what failed and what still works), stale, offline, no gauges in this county, no open shelters, routing unavailable, reports unavailable. Write real copy for each.

12.10 **404 page**, favicon, page titles, social preview image, a print-friendly "what to do" checklist per hazard.

---

## 13. Design system: it must NOT look vibe-coded or like a template

**Direction:** calm, credible, civic-data publication. Think of a well-made government data product or a newsroom data graphic: quiet, precise, typographically strong, data as the visual hero. Trustworthy first, pretty second. During an emergency it must be readable in seconds on a cracked phone screen in bright sun.

**Never:** purple/blue-to-pink gradients; gradient text; glassmorphism or blur; floating blobs or abstract hero art; a centered hero with a gradient call-to-action; emoji as icons; identical rounded cards in a three-column grid; heavy shadows; neon glows; AI sparkle icons; stock photos; default framework look; bouncy or excessive animation; filler copy ("Welcome to our amazing platform"); exclamation points.

**Foundation (define as CSS tokens in `tokens.css`, then use only tokens):**
- **Layout:** 8px spacing grid; ~1120px max width for text pages, full-bleed for the map; generous whitespace; mobile-first. Test at 360, 390, 768, 1024, 1440 px.
- **Typography:** two families maximum. A distinctive but highly legible sans for UI and data (avoid the most overused AI-demo defaults), optionally a refined serif for long-form headings. Self-host or use a reliable source with `font-display: swap` and good fallbacks. Type scale like 12/14/16/18/24/32/44. Tabular numerals for data. Prose lines 60 to 75 characters. Hierarchy through size and weight, not color alone.
- **Color:** warm off-white background, near-black ink with a slight blue cast, cool grays, and ONE deep water-blue accent. Four status colors (Normal, Watch, Warning, Danger) that are distinct, colorblind-distinguishable, meet WCAG AA, and are always paired with icon + label. Map scales: perceptually uniform sequential palettes; no red/green-only distinctions. Hazard types are distinguished by icon first, color second. Light mode default; dark mode is P2.
- **Surfaces:** flat. 1px hairline borders and spacing, not shadows. Radius 4 to 8px, consistent. At most two elevation levels (popovers, detail panel, bottom sheet).
- **Components** (build a small consistent set): status card, status badge, hazard chip, stat block, gauge row with sparkline, alert row, route card, report card, category picker, segmented control, tabs, bottom sheet (mobile) / side panel (desktop), legend, banner (info, stale, simulation, emergency), button (primary, secondary, text, danger), text input, select, toggle. Every interactive element has hover, focus-visible, active, disabled states.
- **Data display:** right-aligned tabular numbers with units; small consistent "meta" text for source and time; simple SVG sparklines (no chart library if avoidable); complete readable legends.
- **Motion:** minimal, under 200ms, purposeful; respect `prefers-reduced-motion`.
- **Copy:** plain, specific, calm, sentence case, active voice. Define jargon inline ("gage height: how high the water surface is, in feet"). Run the `design:ux-copy` style of review over all copy if available.
- **Polish checklist before calling any screen done:** grid alignment, consistent spacing, every state designed, no layout shift, no orphaned UI, tap targets ≥ 44px, works one-handed on a phone.

If a frontend design skill or similar guidance is available in your environment, use it, but the rules above take priority.

---

## 14. Accessibility, performance and quality bars

- **WCAG 2.2 AA:** contrast; full keyboard operation including map layers, tract selection, route planning and report submission; visible focus; semantic landmarks; labeled controls; `aria-live` announcements when status changes; text alternatives for every map (county/tract table, route step list, report list); no information by color alone; 200% zoom without breaking; touch targets ≥ 44px.
- **Performance:** main view under ~1.5 MB transferred; lazy-load map data and the route/report modules; simplified geometries; cache static data. Lighthouse mobile scores for performance, accessibility and best practices all 90+. Report the actual numbers.
- No console errors or warnings in the production build. Graceful behavior on slow 3G (test with throttling).

---

## 15. Testing and verification

- Unit tests for: alert-to-hazard mapping, every level rule, flood rules, vulnerability/exposure math, guidance selection (including "no route button for tornado"), route scoring, avoid-area building and simplification, report validation, staleness logic.
- Fixture tests using the real trimmed API responses saved in `/tests/fixtures`.
- Manual test script in `NOTES.md` for each phase (what to click, what should happen), which you run in a real browser at mobile and desktop widths before telling me something works.
- Before the final submission: a full click-through of every screen in live mode and in Scenario Mode, on a real phone.

---

## 16. Phases, dates and checkpoints

At the end of each phase: run tests, check in a browser at mobile and desktop widths, commit with a clear message, deploy, and give me a 3 to 5 line plain-English summary plus "what to look at." **Stop at each checkpoint and show me** before moving on.

| Phase | When | Goal |
|---|---|---|
| 0. Setup | Sat 10/17 | Repo, tooling, folder structure, tokens file, README stub, GitHub Pages deploy of a placeholder page, `NOTES.md` started. |
| 1. Verify data + first live page | Sat 10/17 to Sun 10/18 | Verify every P0 and P1 source with real calls; write `DATA_SOURCES.md` and fixtures; a page with live gauges and active alerts for York County, deployed. Tell me honestly what worked, what didn't, and substitutes. |
| 2. P0 engine + all 8 counties | Sun 10/18 | County-agnostic pipeline, Census + FEMA + boundaries, flood engine + vulnerability scoring with tests, status card + guidance, district map, Scenario Mode basic. |
| 3. P1a multi-hazard | Mon 10/19 to Tue 10/20 (short sessions) | Mapping table, icons, guidance copy for all hazards, tests. |
| 4. P1b route planner | Tue 10/20 to Wed 10/21 | Worker proxy, ORS with avoid polygons, shelters, route cards, safety framing. **Cut-rule check Wednesday night.** |
| 5. P1c reporting | Wed 10/21 to Thu 10/22 | Supabase schema + RLS, Turnstile, report flow, map layer, votes, admin view, official links. **Cut-rule check.** |
| 6. Polish | Fri 10/23 | Full design pass, all states, accessibility audit + fixes, performance pass, Methodology/About pages. |
| 7. Submission readiness | Sat 10/24 | README, `AI_DISCLOSURE.md`, `SUBMISSION.md`, clean public repo (no secrets), final deploy, full phone click-through, demo video support. |
| 8. Submit | Sun 10/25 | I submit. Only emergency fixes. Freeze the code. |

**Definition of done:** live URL works on a phone; live data loads for all 8 counties or clearly explains why not; Scenario Mode demonstrates all four levels and at least three hazard types; the route planner and reporting work end to end (or are cleanly switched off); tests pass; accessibility and performance bars met and reported; METHODOLOGY complete; nothing in the UI overclaims.

---

## 17. Submission materials (Phase 7)

Create `SUBMISSION.md` with drafts I will edit in my own words:
- **App name and one-sentence description.**
- **Target audience** (residents of SC-5, especially areas with older adults and households without cars).
- **How the app works** (short, plain-English walkthrough of data sources → rules → status, guidance, routes, reports).
- **Technical challenge(s)** drawn from the real problems in `NOTES.md` (for example combining live and static data from different agencies with different formats; routing around hazard polygons within free-tier limits; protecting a public reporting form from spam without collecting personal data).
- **Demo video outline (rules say 1 to 3 minutes; aim for about 2:45, never over 3:00; uploaded public on YouTube or Vimeo).** It must state: my name, the app's name, a one-sentence purpose, the target audience, the tools and coding languages used (and the AI disclosure), and then demonstrate the app. Suggested flow: intro with the required items (20 s) → problem in SC-5 (10 to 15 s) → live status for my county → switch to Scenario Mode to show a flood Warning and a tornado Warning (and why there's no route button for tornadoes) → plan a lower-exposure route to a shelter → submit a "streetlight out" report → methodology page showing it's transparent → what I learned.
- **`FINAL_SUMMARY.md` (write this when the app is done):** a detailed, plain-English walkthrough of the whole finished app, so I can study it before the video and judging. Include: what the app does and who it's for; every screen and feature and how to use it; every data source, what it provides, and how the app gets it; how the hazard engine decides each status level (with the rules and examples); how the vulnerability scores, route planner, and community reports work; how the pieces connect (a simple diagram of data → rules → screens); the tech stack and every library or service and why it was chosen; the biggest technical problems and how they were solved; known limitations; and a list of likely judge questions with clear answers.
- `AI_DISCLOSURE.md`: state honestly that Claude (an AI coding assistant) wrote much of the code under my direction, and describe my role: choosing the problem, defining features and design, testing, verifying data, and writing the submission. Keep it accurate.

---

## 18. Working agreements for you (Claude Code)

- **Plan first.** Before each phase, give me a short plan. Wait for my go-ahead only when there's a big decision; otherwise proceed.
- **Verify, don't assume.** Real API calls before building on any source. Test your own work in a browser and run tests before telling me it works.
- **Be honest about problems.** If an API is down, blocked, limited, or different from what this brief says, tell me and propose the best free alternative. Never silently fake it.
- **Keep `NOTES.md` current** with four sections: *Assumptions*; *Decisions* (one-sentence reasons); *Problems and fixes* (each real problem, how we diagnosed it, how we solved it, in plain English); *Open questions for me*. Also a *Later* list for ideas outside scope.
- **Commit often** with meaningful messages. Never commit secrets, `.env` files, or large raw data dumps. Add a `.gitignore` early.
- **Protect the core.** Never break P0 while building P1. Use feature flags. End every session with a working, deployed app.
- **Design quality is a requirement.** When I say something looks off or reads badly, fix it properly instead of patching.
- **Safety first in wording.** Never say "safe." Always link official sources. Never discourage calling 911 or following officials.
- **Explain as you go**, in plain language, so I can present this as my own understanding.
