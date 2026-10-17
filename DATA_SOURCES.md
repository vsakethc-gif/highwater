# Data sources

Every source below was checked with a real request on **Saturday, October 17, 2026**. Trimmed real responses are saved in [`tests/fixtures/`](tests/fixtures/).

**"Browser OK?"** means the source allows a web page to call it directly. Technically, it sends the CORS header `Access-Control-Allow-Origin`. Sources that don't allow this need a helper (our Cloudflare Worker or a scheduled GitHub Action).

## Summary

| # | Source | Works? | Browser OK? | Key? | Used for | Phase |
|---|---|---|---|---|---|---|
| 1a | USGS Water Data API (new) | Yes | Yes | Optional | Live gauge readings + trend | 1 |
| 1b | USGS WaterServices (legacy) | Yes, **retiring early 2027** | Yes | No | Fallback only | 1 |
| 2 | NOAA NWPS | Yes | Yes | No | Official flood stages, USGS↔NWS ID link | 1–2 |
| 3 | NWS alerts | Yes | Yes* | No | All official alerts | 1 |
| 4 | NWS gridpoint forecast | Yes | Yes* | No | Rain in next 24/48 h | 2 |
| 5 | FEMA NFHL flood zones | Yes | Yes | No | Point flood zone, tract exposure, route crossings | 2 |
| 6 | Census ACS 5-year (2020–2024) | Yes | n/a (script only) | **Yes (required)** | Vulnerability measures | 2 |
| 7 | Census boundary files | Yes | n/a (script only) | No | Tract + county outlines | 2 |
| 7b | Census TIGERweb | Yes | — | No | Verified county FIPS codes | 1 |
| 8 | Census Geocoder | Yes | **No** | No | Address search (via Worker) | 2+ |
| 9 | OpenRouteService | Needs key | via Worker only | **Yes** | Routes that avoid hazard areas | 4 |
| 9b | OSRM demo server | Yes | Yes | No | Fallback route (no avoidance) | 4 |
| 10 | FEMA Open Shelters | Yes | Yes | No | Open shelters | 4 |
| 11 | SC 511 road closures | **No public feed found** | — | — | Skipped | — |
| 14 | OpenFreeMap basemap | Yes | Yes | No | Map background | 2 |
| 15 | Census ZCTA Gazetteer | Yes | n/a (script only) | No | ZIP code centers | 2 |
| 12 | Supabase | Not set up yet | Yes | Public anon key | Community reports database | 5 |
| 13 | Cloudflare Turnstile | Not set up yet | Yes | Site key (public) + secret (Worker) | Spam protection | 5 |

\* NWS rejects requests that send **no** `User-Agent` header (we got `403`). Browsers always send their own, and that is accepted (`200`).

---

## 1a. USGS Water Data API (primary)

- **Docs:** https://api.waterdata.usgs.gov/docs/ogcapi/
- **Latest reading, several gauges at once:**
  `https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items?f=json&parameter_code=00065&monitoring_location_id=USGS-02146000,USGS-02147020`
- **Recent series (for trend and sparkline):**
  `.../collections/continuous/items?f=json&monitoring_location_id=USGS-02146000&parameter_code=00065&time=PT6H&limit=1000`
  (`time=PT6H` means "the last 6 hours"; `properties=` and `skipGeometry=true` shrink the response.)
- **Gauge list for a county:** `.../collections/monitoring-locations/items?f=json&state_code=45&county_code=091&site_type_code=ST`
- **Parameters:** `00065` = gage height (ft), `00060` = discharge (ft³/s).
- **Auth:** none required. A free key raises the rate limit. Responses showed no `X-RateLimit` headers, so **the keyless limit is unknown**. The docs say a `429 Too Many Requests` error means you hit it.
- **Browser OK:** yes (`Access-Control-Allow-Origin: *`).
- **Updates:** about every 15 minutes. Values are **provisional** (`"approval_status": "Provisional"`).
- **License:** U.S. public domain. Credit: "U.S. Geological Survey."
- **Quirks:**
  - Values are strings (`"5.11"`), so convert to numbers.
  - A bounding-box search also returns North Carolina gauges and dead gauges (one had a 2021 reading), so we use a fixed gauge list per county and ignore old readings.
  - IDs carry a `USGS-` prefix.

## 1b. USGS WaterServices, legacy (fallback)

- **URL:** `https://waterservices.usgs.gov/nwis/iv/?format=json&countyCd=45091&parameterCd=00065,00060&siteStatus=active&period=PT6H`
- **Result:** 10 active York County gauges, readings about 15 minutes old, all qualified `P` (provisional). Browser OK.
- **Being retired:** USGS says degradation starts November 2026, with outages in January 2027 and shutdown in early 2027 ([USGS blog](https://waterdata.usgs.gov/blog/api-waterservices-decom/), [Summer 2026 update](https://waterdata.usgs.gov/blog/api-updates-2026/)). **Judging happens after that starts, so this is a fallback only.**
- **Quirk:** some gauges return an empty discharge series (gage height only).

## 2. NOAA National Water Prediction Service (NWPS)

- **Docs:** https://api.water.noaa.gov/nwps/v1/docs/
- **Gauges in an area:** `https://api.water.noaa.gov/nwps/v1/gauges?bbox.xmin=-81.9&bbox.ymin=33.9&bbox.xmax=-80.1&bbox.ymax=35.2&srid=EPSG_4326` (87 gauges)
- **One gauge:** `https://api.water.noaa.gov/nwps/v1/gauges/ALIS1`
- **What we get:**
  - `usgsId`, which links NOAA's ID to USGS's: `ALIS1` ↔ `021457492`, `CTBS1` ↔ `02147020`.
  - `flood.categories` with official stages, e.g. Allison Creek: action 12 ft, minor 14, moderate 19, major 22.
  - `status.observed.floodCategory` (`no_flooding`, `not_defined`, `out_of_service`, `obs_not_current`, ...).
- **Auth:** none. **Browser OK:** yes.
- **Quirks:**
  - Missing numbers are `-9999` or `-999`, never `null`. Treat those as "no data."
  - `not_defined` means the gauge has no official flood stage. We never invent one (brief §5.1).
- **Plan:** a script saves the USGS↔NWS link and thresholds to a static file. The app compares each live reading to them, so every status traces to a visible rule.

## 3. NWS alerts

- **URL:** `https://api.weather.gov/alerts/active?area=SC` (GeoJSON)
- **Auth:** none. Scripts send `User-Agent: SC5Ready (vsakethc-gif.github.io/sc5-ready)` as NWS asks.
- **Browser OK:** yes (`*`). Cache is 5 seconds. About 5 KB gzipped.
- **Matching alerts to counties:**
  - `geocode.SAME` lists county codes as `0` + FIPS (`045057` = Lancaster).
  - `geocode.UGC` lists zones (`SCZ009`) and sometimes counties (`SCC091`).
- **Polygons:** storm-based warnings (Tornado, Flash Flood, Flood Warning, Flood Advisory) have `geometry`. Watches and advisories usually don't (`null`).
- **Quirks:**
  - **The feed includes cancel/expire messages.** Read the action code in `parameters.VTEC` (`/O.NEW.`, `CON`, `EXT`, `CAN`, `EXP`). `CAN` and `EXP` must never raise a status.
  - Damage threat tags exist when issued, e.g. `flashFloodDamageThreat: ["CONSIDERABLE"]` (real, Oct 11, 2026). Tornado warnings carry `tornadoDetection`.
  - Event names seen in SC this month: Flood Warning, Flood Advisory, Flood Watch, Flash Flood Warning, Tornado Warning, Tornado Watch, Special Weather Statement, Lake Wind Advisory, Frost Advisory, Rip Current Statement, Beach Hazards Statement, Coastal Flood Advisory.
- **Live example on Oct 17:** a Lake Wind Advisory covering Fairfield, Kershaw, Lancaster, and Lee.

## 4. NWS gridpoint rain forecast

- **Step 1:** `https://api.weather.gov/points/34.9249,-81.0251` → `forecastGridData` = `https://api.weather.gov/gridpoints/GSP/114,51`
- **Step 2:** read `properties.quantitativePrecipitation`.
- **Units:** **millimeters** (`wmoUnit:mm`). Divide by 25.4 for inches.
- **Quirk:** each value covers an interval with its own length (`2026-10-17T18:00:00+00:00/PT6H`). Summing "the next 24 hours" means adding the overlapping part of each interval.
- **Size:** 290 KB raw, **13 KB gzipped**. Browser OK.
- **Note:** SC-5 spans two NWS offices: Greenville-Spartanburg (GSP) and Columbia (CAE).

## 5. FEMA National Flood Hazard Layer

- **Service:** `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer`
- **Flood Hazard Zones = layer 28** (checked by name; layer numbers can change).
- **Point lookup:** `.../MapServer/28/query?geometry=-80.9740,34.9849&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,DFIRM_ID&returnGeometry=false&f=json`
  - Catawba gauge → `AE`, `FLOODWAY`, SFHA `T` (high-risk area)
  - Downtown Rock Hill → `X`, "AREA OF MINIMAL FLOOD HAZARD", SFHA `F`
- **Browser OK:** yes (it echoes our origin). Point queries take about 0.1–0.4 s. `maxRecordCount` 2000. Formats: JSON, GeoJSON, PBF.
- **York County:** 1,535 high-risk (SFHA) polygons.
- **Quirk:** asking for a field that doesn't exist (`EFF_DATE`) fails with a generic `400`. Valid fields include `FLD_ZONE`, `ZONE_SUBTY`, `SFHA_TF`, `STATIC_BFE`, `DFIRM_ID`, `SOURCE_CIT`.
- **Limitation:** a flood zone is long-term risk, not current flooding, and not an official property determination.

## 6. Census ACS 5-year

- **Latest vintage:** **2024** (2020–2024 estimates). Vintages listed: 2021–2024.
- **Auth:** **an API key is now required for every request.** Without one, the API redirects to `missing_key.html`. Free sign-up: https://api.census.gov/data/key_signup.html. The key goes only in `.env` and GitHub Secrets.
- **Variables (labels checked against `variables.json`):**
  - Total population: `B01001_001E`
  - Age 65+: men `B01001_020E`–`_025E`, women `B01001_044E`–`_049E`
  - No vehicle: `B25044_003E` (owner) + `B25044_010E` (renter), out of `B25044_001E` households
  - Below poverty: `B17001_002E` out of `B17001_001E`
  - Disability (optional): `B18101` "With a disability" cells, out of `B18101_001E`
- **Query shape:** `https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E,...&for=tract:*&in=state:45%20county:091&key=KEY`

## 7. Census boundaries

- Tracts: `https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_45_tract_500k.zip` (1.3 MB)
- Counties: `https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_500k.zip` (11.6 MB, we keep only SC-5)
- No key. Public domain.

### 7b. County FIPS check (TIGERweb, no key)
`State_County/MapServer/1` confirmed: Cherokee 45021, Chester 45023, Fairfield 45039, Kershaw 45055, Lancaster 45057, Lee 45061, Union 45087, York 45091 (and Spartanburg 45083, Sumter 45085).

## 8. Census Geocoder

- **URL:** `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=...&benchmark=Public_AR_Current&format=json`
- **Works:** "155 Johnston St, Rock Hill, SC 29730" → (−81.0290, 34.9233), in 0.36 s.
- **Browser OK: no** (no CORS header). It has to go through the Worker.
- **A ZIP code alone returns 0 matches.** Plan: a static list of SC-5 ZIP centers from the Census ZCTA Gazetteer file.

## 9. OpenRouteService

- **Directions:** `POST https://api.openrouteservice.org/v2/directions/driving-car/geojson`. Without a key: `401 Authorization field missing` (expected).
- **Key:** free sign-up at openrouteservice.org (needed in Phase 4). It is kept only in the Worker.
- **Limits** ([restrictions page](https://openrouteservice.org/restrictions/)):
  - **Avoid polygons: at most 200 km² in area and 20 km wide or tall.**
  - Routes with avoid areas: at most 150 km.
  - Up to 3 alternatives (100 km max).
  - Daily and per-minute quotas aren't listed there; check the dashboard after sign-up.
- **Important for Phase 4:** many warning polygons are bigger than 20 km across, so avoid areas must be clipped to the part near the route. See NOTES.

### 9b. OSRM demo server (fallback)
- `https://router.project-osrm.org/route/v1/driving/-81.029,34.923;-80.86,34.72?overview=false` → 32 min, 23 mi. Browser OK.
- **Cannot avoid areas.** Usage policy: light use only (see the project's usage policy).

## 10. FEMA Open Shelters

- **Layer:** `https://gis.fema.gov/arcgis/rest/services/NSS/OpenShelters/FeatureServer/0`
- **Query:** `.../query?where=state%3D%27SC%27&outFields=*&f=json`
- **Fields:** `shelter_name`, `address`, `city`, `state`, `zip`, `shelter_status`, `evacuation_capacity`, `total_population`, `pet_accommodations_code`, `wheelchair_accessible`, `ada_compliant`, `latitude`, `longitude`, `org_name`.
- **Browser OK:** yes.
- **Updates:** synced with the Red Cross database every morning, then checked every 20 minutes (from the service description).
- **On Oct 17: 0 open shelters in SC** (20 nationwide). The app must say so and link county emergency management.
- **Quirk:** there is **no last-updated field**, so the app shows "checked at [time we fetched it]."

## 11. SC 511 road closures

No documented public developer feed was found. There is an SCDOT map service, but its terms and stability are unclear. **Skipped.** This is listed as a limitation: routes can't see road closures.

## 12. Supabase (free plan, [pricing page](https://supabase.com/pricing))

- 500 MB database, 5 GB egress, 500,000 Edge Function calls, 2 active projects.
- **Paused after 1 week of inactivity.** Judging happens after submission, so we'll add a scheduled GitHub Action that touches the database every few days. A paused project can be restored from the Supabase dashboard.

## 13. Cloudflare Turnstile ([plans](https://developers.cloudflare.com/turnstile/plans/))

Free: up to 20 widgets, 10 hostnames each, unlimited challenges.

## 14. OpenFreeMap basemap (added in Phase 2)

- **Style:** `https://tiles.openfreemap.org/styles/positron`. Browser OK (`*`). Uses fonts "Noto Sans Regular/Bold/Italic" from the same server.
- **Terms** ([openfreemap.org](https://openfreemap.org/)): free, no registration, no API keys, no cookies; no limits on normal map views; websites and commercial use allowed. **Attribution required** (MapLibre shows it automatically): OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors.
- **Why not CARTO:** CARTO basemaps now require an API key (free for non-commercial up to 5M tile requests/month) and show a watermark without one ([CARTO basemap-styles README](https://github.com/CartoDB/basemap-styles)).

## 15. Census ZCTA Gazetteer (added in Phase 2)

- `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip` (1 MB, no key). Tab-separated: `GEOID`, `INTPTLAT`, `INTPTLONG`.
- 47 ZIP codes have their center inside an SC-5 county. Spot checks: 29730 Rock Hill → York, 29720 Lancaster → Lancaster, 29020 Camden → Kershaw, 29010 Bishopville → Lee.

## Built data files (Phase 2)

| File | Size | Made by | Contents |
|---|---|---|---|
| `public/data/gauges.json` | 9.5 KB | build-gauges.mjs | 39 active gauges, 17 with official flood stages |
| `public/data/counties.geojson` | 14 KB | build-boundaries.mjs | 8 county outlines (simplified 20%) |
| `public/data/tracts.geojson` | 131 KB | build-boundaries + build-tracts | 149 tracts with ACS 2024 measures and SFHA share |
| `public/data/zips.json` | 1.6 KB | build-zips.mjs | 47 ZIP centers |

**ACS check:** total population across the 149 tracts is 618,892, consistent with the 8 counties' published totals.

## P2 sources (not checked yet; only if time allows)
AirNow, USGS earthquake feeds, NASA FIRMS.
