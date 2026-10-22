# HIGHWATER PHONE APP — COMPLETE BUILD, UI/UX AND MOTION BRIEF

**This file replaces `NATIVE_APP.md`.** Read `CLAUDE.md` for the product, data sources, hazard engine, safety rules and limitations. Then read this whole file before writing code. Where this file and `CLAUDE.md` disagree about the *phone app's* look, layout or motion, this file wins. `CLAUDE.md` still wins on data, safety wording, privacy, free-only and honesty rules.

The web app is finished and live at `https://vsakethc-gif.github.io/highwater/`. It is the backup for my submission. **Do not break it.**

---

## 0. The goal in one paragraph

Build a native iPhone/Android app (React Native + Expo, run in **Expo Go** on my phone, not published) that **works reliably and looks and feels like a top App Store app.** When judges watch my 3-minute demo video, the app should look as polished as the best apps on their own phones: calm, clear, beautifully typeset, smooth 60 fps motion, satisfying touch feedback, and smart transitions that explain what's happening. It must never look AI-generated or template-like, and style must never get in the way of emergency information.

**Clock:** today is Wednesday 10/21 (evening). I record the demo video on **Friday 10/23**, keep **Saturday 10/24** as a buffer for fixes and re-recording, and submit **Sunday 10/25**. Plan for that.

**Priority order when time is short:** (1) it works and never crashes, (2) it's clear and readable, (3) it looks polished, (4) it has delightful motion. Never trade (1) or (2) for (3) or (4).

---

## 1. Start here: audit, then plan

Before writing new code:
1. Check what already exists in `/mobile` (if anything) and compare it with this file.
2. Give me a short gap list in plain language: what's done, what's missing, and what needs redoing to meet this brief.
3. Propose the build order for tonight and Thursday (section 16), then start.

Explain every part in plain language as you build it (what it does, how it works, why). Keep `NOTES.md`, `LEARNING.md` and `FINAL_SUMMARY.md` updated (section 18).

---

## 2. Technical foundation

### 2.1 Stack (verify each library works in Expo Go for the current Expo SDK before using it)
- **Expo** (latest stable SDK), **TypeScript**, **Expo Router** (file-based navigation, native stack + tabs).
- **react-native-reanimated** (UI-thread animations), **react-native-gesture-handler** (gestures).
- **react-native-svg** (icons, gauges, charts) and/or **@shopify/react-native-skia** (water-fill and wave effects) — use Skia only if it's supported in Expo Go for our SDK; otherwise SVG.
- **react-native-maps** (native map; Apple Maps on iOS, Google Maps on Android in Expo Go).
- **@gorhom/bottom-sheet** (if Expo Go–compatible; otherwise a Reanimated-based custom sheet).
- **@shopify/flash-list** for long lists (fallback `FlatList`).
- **expo-haptics**, **expo-location**, **expo-blur** (only where the OS uses blur), **expo-font** + **@expo-google-fonts/***, **expo-linear-gradient** (only for very subtle tints, never decorative gradients), **expo-sharing**, **@react-native-async-storage/async-storage**, **react-native-safe-area-context**, **lucide-react-native**.
- Optional if compatible: **lottie-react-native** for the success checkmark; otherwise draw it with SVG + Reanimated.
- Do not use any library that needs a custom development build. If something important needs one, ask me first.

### 2.2 Architecture: one brain, two apps
- The pure logic (hazard engine and mapping table, flood rules, vulnerability math, guidance rules and copy, route scoring, avoid-area building, report validation, parsers, types, config) lives in a shared folder (for example `/shared`) imported by both the web app and the phone app. If this refactor isn't done yet, do it carefully: run all tests before and after and confirm the web app still builds and deploys.
- The phone app reuses the same Cloudflare Worker, Supabase project and data sources. Add the phone app's needs (for example CORS/origin handling) without weakening security.

### 2.3 Folder structure
```
/mobile
  /app                 Expo Router screens: (tabs)/status, map, route, report, more; gauge/[id]; alert/[id]; onboarding; scenario; gallery
  /components/ui       Design-system components (Button, Card, Chip, Sheet, StatusBadge, ...)
  /components/data     Gauge, Sparkline, WaterFill, RainBars, AlertRow, RouteCard, ReportCard ...
  /components/map      Map layers, markers, legend, layer chips
  /theme               tokens.ts (color, type, space, radius, elevation), motion.ts, haptics.ts, ThemeProvider
  /hooks               useLiveData, useLocation, useReducedMotion, useScenario, usePersistedState
  /lib                 platform glue only (storage, linking); logic comes from /shared
  /assets              fonts, icon, splash, illustrations (our own, SVG)
```

### 2.4 Reliability rules (it has to work)
- No crashes. Wrap each tab in an error boundary with a friendly recovery screen ("Something didn't load. Your other tabs still work." + Retry).
- All network calls have timeouts, retries with backoff, and cached fallbacks. Show cached data with its timestamp when offline.
- Location permission denied, no network, API down, empty results: every case has a designed state (section 12).
- TypeScript strict mode, no `any` in app code, no yellow-box warnings left in the build.
- Test on my real phone through Expo Go after every phase.

---

## 3. Design direction

**Personality:** calm, precise, trustworthy, quietly beautiful. A civic tool with the craft of a premium consumer app. Think of the polish level of Apple Weather, Citymapper or Things 3 — learn from their quality, never copy their layouts, assets or branding.

**Signature idea — "the water line":** one visual motif that makes the app recognizable. A soft horizontal water line with a gentle wave edge appears in exactly these places: the splash screen, the onboarding illustration, the bottom edge of the hero status card (its height reflects the status level), the gauge water-fill, and the pull-to-refresh indicator. Use it consistently, never as random decoration.

**Rules of taste:**
- One obvious most-important thing per screen.
- Big, confident typography for the status; quiet, small, consistent meta text for sources and times.
- Lots of breathing room. Alignment on an 8 pt grid. Optical alignment for icons next to text.
- Color is meaningful (status, hazard, accent). Neutrals do most of the work.
- Depth is subtle: hairlines and very soft shadows, never heavy drop shadows.
- Every animation explains something. If an animation doesn't explain what changed, where something came from, or confirm an action, remove it.

---

## 4. Design tokens (implement in `/mobile/theme/tokens.ts`; use only tokens)

Values below are the starting point. **Run a contrast check script** on every text/background and status pair in both themes and adjust values until all body text meets WCAG AA (4.5:1) and large text/icons meet 3:1. Record the final values and contrast ratios in `NOTES.md`.

### 4.1 Color — light theme
| Token | Value | Use |
|---|---|---|
| `bg` | `#F7F5F0` | App background (warm off-white) |
| `surface` | `#FFFFFF` | Cards, sheets |
| `surfaceSunken` | `#EFEBE3` | Inputs, segmented control track |
| `ink` | `#0F1A24` | Primary text |
| `inkMuted` | `#47535E` | Secondary text |
| `inkFaint` | `#68737D` | Meta text (verify contrast) |
| `hairline` | `#E2DDD3` | Dividers, borders |
| `accent` | `#0B4F7A` | Primary actions, links, selected states (deep water blue) |
| `accentSoft` | `#DCE9F2` | Selected chip backgrounds, highlights |
| `water` | `#2A7AB0` → `#7FB6D9` | Water-line motif fills (top → bottom, subtle) |

### 4.2 Color — dark theme
| Token | Value |
|---|---|
| `bg` | `#0B1117` |
| `surface` | `#121A22` |
| `surfaceSunken` | `#18222C` |
| `ink` | `#E9EEF2` |
| `inkMuted` | `#A9B5C0` |
| `inkFaint` | `#8794A0` |
| `hairline` | `#22303B` |
| `accent` | `#6BB6E8` |
| `accentSoft` | `#16324A` |
| `water` | `#2C6E9C` → `#1B4767` |

### 4.3 Status colors (always paired with an icon AND a text label)
| Level | Name | Light fg / bg | Dark fg / bg | Icon (Lucide) |
|---|---|---|---|---|
| 0 | Normal | `#2B6A5E` / `#E3F0EC` | `#7CCBB8` / `#12302A` | `circle-check` |
| 1 | Watch | `#8A5A00` / `#FBEFD3` | `#F2C46B` / `#3A2C0C` | `eye` |
| 2 | Warning | `#A8420F` / `#FBE3D5` | `#FF9F6E` / `#3E1D0E` | `triangle-alert` |
| 3 | Danger | `#9A1B30` / `#F8DADF` | `#FF8A9B` / `#42121B` | `octagon-alert` |

Status hues must stay distinguishable for color-blind users (test with a deuteranopia/protanopia simulation) and never be the only signal.

### 4.4 Hazard icons (Lucide, one stroke width everywhere: 1.75)
Flood `waves` · Tornado `tornado` · Severe storm `cloud-lightning` · Tropical `wind` + label · Winter/ice `snowflake` · Heat `thermometer-sun` · Cold `thermometer-snowflake` · Wind `wind` · Fire weather `flame` · Fog `cloud-fog` · Air quality `factory` (or closest available) · Other `info`. Verify names exist in the installed Lucide version.

### 4.5 Typography
- **UI and data:** **Public Sans** (the U.S. government's open typeface; fitting for a civic app, highly legible). Weights 400, 500, 600, 700.
- **Display and editorial headings** (onboarding, Methodology/About titles, the status level word): **Newsreader** (refined serif) at 500/600. Use sparingly.
- Load via `@expo-google-fonts` (verify both are available); fall back to system fonts if loading fails.
- Use tabular numerals for all changing numbers (`fontVariant: ['tabular-nums']`; on platforms where unsupported, keep numbers in fixed-width containers so they don't jitter).

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 40 / 44 | Newsreader 600 | Status level word on hero card |
| `title1` | 30 / 36 | Public Sans 700 | Screen titles (large) |
| `title2` | 24 / 30 | 700 | Section heroes |
| `title3` | 20 / 26 | 600 | Card titles |
| `headline` | 17 / 24 | 600 | Row titles, emphasis |
| `body` | 16 / 24 | 400 | Body text |
| `callout` | 15 / 22 | 500 | Secondary content |
| `footnote` | 13 / 18 | 500 | Meta: source, time, "provisional" |
| `caption` | 12 / 16 | 600, letter-spacing +0.4, uppercase | Section labels |
| `numberXL` | 48 / 52 | 600, tabular | Gauge reading on detail screen |
| `numberL` | 28 / 32 | 600, tabular | Key stats |

Support Dynamic Type / font scaling up to about 200% without clipping; layouts reflow instead of truncating important info.

### 4.6 Spacing, radius, elevation
- Spacing scale: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Screen side padding 20. Section gap 32. Card inner padding 16 to 20.
- Radius: `sm 8` (chips, inputs, small buttons), `md 14` (cards), `lg 20` (hero card), `sheet 28` (bottom sheet top corners), `pill 999`.
- Elevation (light theme): `e1` = shadow y2 blur8 opacity 0.06; `e2` = y8 blur24 opacity 0.10 (sheets, floating map controls). Dark theme: no shadows; use `surface` steps and a 1 px `hairline` border instead.
- Hit targets: minimum 44 × 44 pt.

---

## 5. Motion system (`/mobile/theme/motion.ts`)

### 5.1 Tokens
- **Durations:** `instant 0`, `micro 120ms`, `fast 200ms`, `base 280ms`, `slow 400ms`, `deliberate 600ms`.
- **Easing:** `standard` = cubic-bezier(0.2, 0, 0, 1); `emphasized` = (0.3, 0, 0, 1); `exit` = (0.4, 0, 1, 1).
- **Springs (Reanimated `withSpring`):**
  - `snappy` = damping 18, stiffness 260, mass 1 (press feedback, toggles, chips)
  - `gentle` = damping 20, stiffness 140, mass 1 (cards entering, layout changes)
  - `sheet` = damping 26, stiffness 220, mass 1 (bottom sheets, drawers)
  - `pop` = damping 12, stiffness 300, mass 0.8 (markers appearing, success check — use rarely)
- **Stagger:** 40 ms per item, max 8 items staggered (the rest appear together).

### 5.2 Rules
- Animate `transform` and `opacity` on the UI thread (Reanimated worklets). Avoid animating layout properties except via Reanimated layout animations.
- Gesture-driven motion follows the finger 1:1 and settles with a spring; any animation can be interrupted.
- Entrance animations play **once per meaningful event** (first load of a screen, new data arriving), not on every re-render or tab revisit.
- No bounce on emergency content. Danger and emergency screens use `fast` fades only.
- **Emergency rule:** 911 buttons, Danger status, and the downed-power-line warning appear with no delay. Animation may accompany them, never delay them.
- **Reduce Motion:** read the system setting (Reanimated's reduced-motion support / `AccessibilityInfo`). When on: replace movement, scale and wave effects with short crossfades; stop the Danger pulse; draw charts instantly.
- Hold 60 fps on my real phone. If anything drops frames, simplify it.

### 5.3 Haptics map (`/mobile/theme/haptics.ts`)
| Event | Haptic |
|---|---|
| Primary button press | `impactLight` |
| Toggle / chip select / segmented control | `selection` |
| Pull-to-refresh triggers | `impactLight` |
| Gauge scrub crosses a flood-stage line | `selection` |
| Status changes to Watch / Warning / Danger | `notificationWarning` (Watch, Warning), `notificationError` (Danger) |
| Report submitted / checklist item done | `notificationSuccess` |
| Error | `notificationError` |
Respect a "Haptics" on/off setting in More.

---

## 6. Component library (build first, in `/mobile/components`)

Build these before the screens, each with all states (default, pressed, focused, disabled, loading, error where relevant), both themes, and Reduce Motion behavior. Add a hidden **Design Gallery** screen (`/gallery`, reachable by long-pressing the app version in More) that shows every component and every animation in every state. This is how we QA the look quickly.

1. **Button:** primary (accent fill), secondary (surface + hairline), text, danger (Danger fg/bg). Press: scale 0.97 with `snappy`, `impactLight`. Loading: label crossfades to a small inline progress indicator, width doesn't jump.
2. **IconButton:** 44 pt, circular, for map controls and headers.
3. **Card:** `surface`, radius `md`, `e1` (light) / hairline (dark). Optional press behavior.
4. **StatusBadge:** icon + label in status fg/bg, pill radius. Animated color/icon morph when level changes.
5. **HazardChip:** hazard icon + label + level dot; horizontal scroll list.
6. **SegmentedControl:** sunken track, sliding thumb animated with `snappy`, `selection` haptic.
7. **LayerChip:** toggleable chip for map layers; checkmark draws in on select.
8. **ListRow:** leading icon or visual, title, subtitle, trailing value (tabular), chevron. Press highlight fade.
9. **SectionHeader:** `caption` style label + optional action.
10. **BottomSheet:** handle, snap points, spring `sheet`, backdrop dims with drag progress, keyboard-aware.
11. **Banner:** info / stale / offline / simulation / emergency variants; slides from top with `gentle`.
12. **Skeleton:** shapes matching real content with a soft shimmer (a moving highlight, 1.2 s loop, low contrast); crossfade to content over `base`.
13. **EmptyState:** small line illustration (our water-line style, SVG), one helpful sentence, optional action.
14. **Toast:** brief confirmations above the tab bar.
15. **Sparkline:** SVG path, draws in left to right (`slow`) on first appearance; optional flood-stage reference line.
16. **WaterFill gauge:** a vertical or rounded-rectangle vessel showing the current level relative to flood stages, with a gentle animated wave on the surface (Skia or SVG), stage ticks labeled "Action, Minor, Moderate, Major". Rises to its value on first appearance (`deliberate`, `emphasized`). Static when Reduce Motion is on.
17. **RainBars:** next 24/48 h precipitation as small bars that grow in with a stagger.
18. **AnimatedNumber:** values count to new numbers smoothly (`base`), tabular so digits don't jump.
19. **ChecklistItem:** tap to check; an animated checkmark draws, the row fades slightly, `notificationSuccess`; persisted on device.
20. **RouteCard, ReportCard, AlertRow, GaugeRow:** data rows built from the above.
21. **TabBar:** custom tab bar on a blurred/opaque surface (follow platform), icons scale 1 → 1.08 and switch from outline to filled on select, label color shifts, small sliding indicator under the active tab.

---

## 7. Navigation and transitions

- **Tabs (bottom):** Status · Map · Route · Report · More. Each tab keeps its own stack and scroll position.
- **Large-title headers** on Status, Report and More that collapse into a compact header on scroll (title shrinks and moves up with scroll position; hairline appears under the header when content scrolls beneath it).
- **Native stack transitions** (push from right on iOS, platform default on Android; swipe-back works).
- **Contextual expand transitions:** tapping a GaugeRow or the hero status card expands it into its detail screen from where it sat (implement as a custom Reanimated expand from the tapped card's position and size into full screen, with content fading in after the shape settles; reverse on back). Do not depend on experimental shared-element APIs unless they're stable in our SDK.
- **Modals:** sheet-style presentation for county picker, layer settings, scenario picker.
- **Deep links within the app:** alert and gauge rows open their detail screens; "Plan a route out" opens Route with the current location prefilled.

---

## 8. Screen-by-screen specification

For every screen: build the layout, all states (section 12), the listed motion, and accessibility labels. After building each screen, run the self-review (section 15).

### 8.1 Launch, splash and onboarding
- **App icon:** a simple mark: a deep-blue rounded square with a white water line (wave) crossing a vertical gauge tick. Crisp at all sizes. Our own design.
- **Splash → home:** splash shows the mark; on load, the water line rises slightly and the mark scales down into the Status header position while Status fades in (`slow`). If data is slow, transition to Status skeletons, not a spinner.
- **Onboarding (first launch only, skippable, 3 pages):**
  1. "Know what's happening near you." Illustration: our water line rising beside a simple river and house line drawing (SVG). Subtitle: live river levels and official alerts for the 8 counties of SC-5.
  2. "Clear steps when it matters." Illustration morphs into a checklist. Subtitle: plain-language steps, routes that avoid known danger areas, and community reports.
  3. "Use your location?" Explain why and that it's not stored; buttons: "Allow location" (system prompt) and "Choose a county instead." Small print: "Highwater is not an official warning system. In an emergency, call 911."
  - Page indicator dots morph (active dot stretches into a pill). Swiping drags illustrations with slight parallax. Buttons have press feedback. Store "onboarded" on device.

### 8.2 Status (home)
Top to bottom:
1. **Header:** large title "Status." Beneath: a **county pill** ("York County ▾" with a location icon if from GPS) that opens the county picker sheet (search field + list of the 8 counties + "Use my location"). Right side: a small **live indicator** ("Live · 3 min ago" with a softly pulsing dot; becomes "Offline · from 2:14 PM" or "Stale" with the matching banner).
2. **Hero status card** (radius `lg`, full width):
   - Status level word in `display` serif ("Warning"), StatusBadge icon, and the top hazard ("Flooding").
   - Headline built from triggers, `title3` ("Flood Warning for the Catawba River near Rock Hill until 8 PM").
   - The **water line** along the bottom of the card, whose height reflects the level (Normal low, Danger high), colored with that level's soft tint.
   - Tap to expand into the status detail (all triggers with sources).
   - **Motion:** on level change, background tint, icon and level word morph (`slow`), the water line rises or falls with a gentle settle, matching haptic. At Danger, the status icon gently pulses (scale 1 → 1.06, 1.6 s, ease in-out) unless Reduce Motion.
3. **"Why this status?"** expandable row: height animates open (`base`), list of triggers each with a source and time, chevron rotates.
4. **Other active hazards:** horizontal HazardChips (hidden when none).
5. **Do this now:** interactive checklist (3 to 6 items from the guidance engine), "Turn around, don't drown" always present for any flood level. For shelter-in-place hazards (tornado, severe storm, extreme cold), show "Stay where you are and take shelter" as the first item and hide routing.
6. **Rivers near you:** GaugeRows (name, mini WaterFill, current reading with unit, trend arrow ▲▼ with "rising/falling/steady," stage label). Tap to open Gauge detail. "Provisional data" footnote.
7. **Rain forecast:** RainBars for next 24 h and 48 h with totals.
8. **Quick actions:** "Plan a route out" (only when leaving makes sense), "Report a problem," "Open map."
9. **Footer:** "Not an official warning system · Sources: NWS, USGS, FEMA, Census · Methodology ›" and an always-visible "Call 911" text button.
- **Pull to refresh:** custom indicator: the water line rises as you pull; at threshold it ripples and `impactLight`; while loading, a slow wave; on finish, it drains back.
- **First load:** skeletons shaped like the hero card, chips, and rows; crossfade to content; list items stagger in once.

### 8.3 Gauge detail
- Expands from the tapped GaugeRow.
- Top: gauge name, river, county, "Provisional · USGS · updated 6 min ago."
- Hero: large WaterFill with labeled stage lines, and the current reading in `numberXL` with unit ("12.4 ft") and trend.
- **Interactive chart:** last 48 h (or 7 days via segmented control). Drag along the chart to scrub: a vertical cursor and dot follow the finger, a callout shows exact value and time, the hero number updates live, and a `selection` haptic fires when crossing a flood-stage line. Release snaps back to "now."
- Stats row: 24 h change, 24 h high, distance to next flood stage.
- "What this means" plain-language explanation, and "No official flood stage" note when applicable (then show the reading vs. its recent range instead).
- Mini map of the gauge location; "View on map" opens Map focused on it.

### 8.4 Alert detail
- Hazard icon, event name, StatusBadge, effective/expires times (relative + exact), counties covered.
- Plain-language summary (from our rules) above the official text; official description and instructions in expandable sections; "View official alert" link.
- Mini map with the alert polygon if available.

### 8.5 Map
- **Full-screen native map** with a light/dark style matching the theme (low-contrast basemap so our data stands out).
- **Floating top bar:** county/search pill (opens search sheet) and a layers IconButton.
- **Layer chips row** under the top bar (horizontally scrollable): Alerts, Rivers, Vulnerability, Flood zones, Priority, Shelters, Reports. Toggling fades the layer in/out (`fast`) with `selection` haptic.
- **Layers:**
  - Alert polygons filled with the hazard's level tint at low opacity, with a crisp outline in the level's fg color; tapping opens a sheet with the alert summary.
  - River gauge markers: custom circular markers with a mini level ring colored by flood category; markers pop in with `pop` spring on first load (staggered, capped); tap selects (marker scales up, others dim slightly) and opens the sheet.
  - Vulnerability / Flood zones / Priority: tract choropleth with a perceptually uniform sequential palette (accessible in both themes), thin tract outlines, stronger county outlines. If tracts are slow, show county-level shading at district zoom and tract detail when zoomed into one county; measure and record the choice.
  - Shelters and Reports: distinct icons; reports labeled "Unverified."
  - User location: native blue dot (or custom puck with a soft pulse).
- **Legend:** compact card bottom-left that expands on tap to the full legend for active layers; animated height.
- **Bottom sheet** (3 snap points: peek, half, full) for whatever is selected: tract details (population, each vulnerability measure with an SC-5 comparison bar that grows in, flood-zone share, plain meanings), gauge preview, alert preview, shelter info, report details.
- **Camera:** smooth fly-to (`slow`, eased) when picking a county or tapping a list item; "Recenter" IconButton appears when the user pans away.
- **Accessibility:** a "List view" toggle shows the same data as accessible lists.

### 8.6 Route
- **Header:** "Plan a route out" with the persistent safety note card: "Routes can't see every closed or flooded road. Never drive through water. Follow official evacuation directions. In danger? Call 911." (Not dismissible.)
- **Inputs:** From (default "My location") and To fields. Destination quick-picks as large tiles: "Nearest open shelter" (with name, distance, updated time, or "No open shelters reported" with a link to county emergency management), "Away from the warning area," and "Choose a place."
- **Results:**
  - The map (top half) animates the camera to fit the routes, then **draws each route line along its path** (`deliberate`): fastest first in neutral, then the lower-exposure route in accent.
  - **Route cards carousel** (swipe horizontally, snap): "Lower-exposure route" and "Fastest route" (+ alternative). Each shows travel time (AnimatedNumber), distance, "+6 min vs fastest," flood-zone crossings, "Passes through an active warning area: Yes/No," nearby unverified reports. The focused card's route highlights on the map while others fade to 30% opacity; swiping cards syncs the map.
  - "Steps" opens a sheet with turn-by-turn steps (staggered in).
  - Handoff buttons: "Open in Apple Maps / Google Maps" with the note that those apps won't avoid our hazard areas. "Share route" via the share sheet.
- **Shelter-in-place hazards active:** the Route tab shows a calm full-screen card: "Stay where you are and take shelter" with the shelter-in-place steps, instead of the planner.
- **Fallback:** if routing falls back to the non-avoiding provider, show a Warning-tinted banner: "This route does not avoid hazard areas."

### 8.7 Report
- **Step 1, category:** a 3 × 3 grid of large tiles (icon + label): Streetlight out, Traffic signal out, Downed tree/debris, Flooded road, Blocked storm drain, Pothole/road damage, Damaged sign, Downed power line, Other. Tiles press with scale and `selection` haptic; selected tile fills with `accentSoft` and its icon animates.
- **Downed power line → emergency screen immediately** (no delay): full-screen Danger palette, large text "Stay at least 35 feet away" (use the verified distance from `CLAUDE.md`), huge tap-to-call buttons "Call 911" and "Call your power company," then a small "Also add it to the map" text button.
- **Step 2, location:** map with a fixed center crosshair pin; the map moves under the pin (pin lifts while dragging, drops with a small `pop` and shadow when released); shows the nearest street name; "Use my location" button.
- **Step 3, details:** optional note (max 280, live character counter), the privacy hint, the Turnstile check (per `CLAUDE.md`), Submit.
- Steps slide horizontally between each other with a progress bar at top that fills smoothly.
- **Success:** animated checkmark draws in a circle (`slow`), `notificationSuccess`, "Thanks. Your report is visible as unverified." plus the official "To get it fixed, also report it here" links for that county/category.
- **Reports near me** (segmented control at top: "New report / Near me"): list sorted by distance with category icon, age ("2 h ago"), distance, confirm count. **Swipe right** = "Still there" (accent), **swipe left** = "Fixed" (Normal green tint); long-press = preview with a mini map; also accessible buttons for each action. Votes animate the count (AnimatedNumber).

### 8.8 More
- Sections: **Demo & simulation** (Scenario Mode), **Learn** (How it works / Methodology, Limitations, Data sources & credits), **Settings** (Appearance: System/Light/Dark segmented control; Haptics toggle; Units), **About** (what it is, who built it, Congressional App Challenge, privacy), app version.
- Rows use ListRow with leading icons; switches animate natively.

### 8.9 Scenario Mode (key demo moment)
- **Scenario picker** sheet with cards: "Hurricane Helene replay (Sept 2024)" (from historical data if available), "Flash flood emergency," "Tornado warning," "Heat warning," each with a short description and "SIMULATION" tag.
- When active:
  - A **persistent banner** slides in at the top of every screen: "SIMULATION — not live data" with an "Exit" button. The app's accent shifts to a distinct simulation tint so it's obvious.
  - A **timeline scrubber** docks above the tab bar: drag through the event hour by hour (with play/pause and speed). As you drag, the hero status card morphs between levels, gauges rise and fall, alert polygons appear and disappear on the map, and the guidance updates. Tick marks show when levels change; haptics on level changes.
  - Nothing is written to the database; routes and reports are local-only.
  - Exiting animates the banner away and restores live data.

---

## 9. Interaction and gesture details

- Every tappable thing has a visible pressed state within one frame.
- Swipe-back on iOS, system back on Android, and sheets dismiss by dragging down.
- Long-press previews on gauges, alerts and reports (with a scale-up preview card and a light haptic).
- Horizontal carousels snap and show a peek of the next item so users know they can swipe.
- Remember choices on device: last county, theme, haptics setting, checklist progress per hazard event, onboarding done.
- Keyboard: inputs scroll into view, return key moves to the next field, tapping outside dismisses.
- Every gesture has a button or accessibility-action alternative.

---

## 10. Copy and voice (UX writing)

- Calm, plain, specific, sentence case, active voice. Short sentences. 8th grade reading level.
- Lead with what matters: "Catawba River at Rock Hill is 2.1 ft below flood stage and falling."
- Never say "safe." Use "No active alerts right now," "Lower-exposure route," "Avoids active warning areas we know about."
- Define terms inline the first time: "Gage height (how high the water is)."
- Times: relative + exact on detail screens ("in 2 hours · 8:00 PM").
- Empty and error states are helpful and specific (examples in section 12).
- No exclamation points, no jokes, no filler, no "Oops."

---

## 11. Accessibility (required)

- `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` and `accessibilityState` on every interactive element; logical focus order; meaningful labels for icons ("Warning level, flooding").
- Screen-reader announcement when the status level changes (`AccessibilityInfo.announceForAccessibility`).
- Dynamic Type up to ~200% with reflow; no truncated critical text.
- Contrast AA in both themes (section 4); no information by color alone.
- Reduce Motion honored (section 5.2); Reduce Transparency honored (no blur → solid surfaces).
- Touch targets ≥ 44 pt; generous spacing between destructive and normal actions.
- Map has a list alternative; charts have a text summary ("Rose 1.8 ft in the last 24 hours").

---

## 12. States (design and animate every one)

| State | What to show |
|---|---|
| First load | Skeletons shaped like content; crossfade in |
| Live | "Live · 3 min ago" with pulsing dot |
| Refreshing | Pull-to-refresh water indicator; content stays visible |
| Stale (> 2 h) | Warning-tinted banner "This information may be out of date. Pull to refresh or check weather.gov." Never show an "all clear" from stale data |
| Offline | "Offline · showing info from 2:14 PM" banner; cached content; actions that need network are disabled with a reason |
| Error (one source) | Inline card: what failed, what still works, Retry |
| No alerts | Normal status with "No active alerts for York County right now" (not "You're safe") |
| No gauges in county | EmptyState: "There are no river gauges in Lee County. Nearby gauges:" + list |
| No open shelters | "No open shelters are reported right now. Check York County Emergency Management for updates." + link |
| Location denied | Friendly card: "Location is off. Choose a county instead." + county picker + "Open Settings" |
| Routing unavailable | "Routing isn't available right now. Use the steps below and follow official directions." |
| Reports unavailable | "Reports can't load right now. If something is dangerous, call 911." |
| Simulation | Banner + simulation tint + "Simulated" tags |

---

## 13. Performance budget

- 60 fps for scrolling, sheets, and all animations on my phone.
- Status screen shows cached content instantly on relaunch and fresh data within a few seconds on a normal connection.
- Lists virtualized (FlashList/FlatList), images and heavy map layers lazy-loaded, map polygons simplified.
- Avoid unnecessary re-renders (memoize rows, stable callbacks, move animation state to shared values).
- Measure and report: cold start time, Status time-to-content, and any screen that drops frames.

---

## 14. "Not vibe-coded" checklist (hard requirement)

**Never ship any of these:** default system blue buttons; default Expo/React Native template screens, colors or fonts; the same white card for everything; purple/indigo gradients, gradient text, glows, glassmorphism; emoji as icons; mixed icon sets or stroke widths; random spacing, radii or font sizes not from tokens; the same fade animation everywhere; animations that replay on every revisit; bouncy motion without purpose; centered walls of text; placeholder copy ("Item 1," "Lorem," "Something went wrong," "Oops"); spinners on blank screens; layout jumping when data loads; misaligned icons and text; tiny hit targets.

**Always show care:** the water-line motif used consistently; clear hierarchy per screen; layouts that differ by purpose (hero, dense data list, full-bleed map, focused step flow); specific local copy; designed empty/error states; remembered choices; consistent motion tokens; optical alignment; both themes polished.

---

## 15. Self-review and QA before every checkpoint

Before showing me any screen, review it against sections 3 to 14 and give me:
1. Its signature motion and its main interaction.
2. Anything that looked "vibe-coded" or generic and what you changed.
3. Screenshots or a short screen recording from a simulator if available (or describe precisely what I should see).
4. A **phone test checklist** for me, for example: "Pull down on Status: the water line should rise, ripple, and you feel a tick. Turn on Reduce Motion in Settings: the ripple becomes a fade."

Keep improving anything that only looks "okay" before calling it done. Use any available design or UX copy review skills for a critique pass.

---

## 16. Build order and timeline

| When | Work |
|---|---|
| **Wed 10/21 night** | Audit + gap list. Shared-logic check (tests pass, web app unaffected). Theme tokens, motion, haptics, fonts, ThemeProvider (light/dark). Core components + Design Gallery. Tab bar. App runs on my phone in Expo Go. |
| **Thu 10/22** | Status (with hero card motion, checklist, gauges, rain, pull-to-refresh), Gauge detail with scrubbing, Map with layers and sheet, Route with route drawing and cards, Report flow with success and "Near me," More, Scenario Mode with timeline. Onboarding + splash + icon. **Thursday night: full polish pass** (consistency, states, both themes, Reduce Motion, accessibility, performance). |
| **Fri 10/23** | Bug fixes from my phone testing in the morning; I record the demo video. Freeze features. |
| **Sat 10/24** | Fixes and re-record if needed. Final docs (section 18). |
| **Sun 10/25** | I submit. Emergency fixes only. |

**Cut rule (tell me before cutting anything):** if we fall behind on Thursday, cut in this order and never ship anything broken:
1. **Could-haves first:** onboarding parallax, long-press previews, splash morph (use a simple fade), contextual expand transition (use the standard push), number roll.
2. **Then should-haves:** gauge chart scrubbing (keep the static chart), custom pull-to-refresh (use the native one, themed), route line draw animation (show lines immediately), swipe actions on reports (keep the buttons).
3. **Never cut:** reliability, readable layouts, both themes looking clean, status card motion, skeletons, press feedback, bottom sheets, Scenario Mode with banner and timeline (the timeline can be a simple slider), safety framing, accessibility basics.

Hide any unfinished feature behind a feature flag.

---

## 17. Demo-video readiness

- A **"Demo ready" check** in the Design Gallery that confirms: fonts loaded, both themes OK, live data loading, Scenario Mode working, no debug overlays or warnings visible.
- Make sure the Expo Go developer menu and any warnings don't appear on screen during normal use.
- Scenario Mode should be the backbone of the video: Normal → Watch → Warning (flood) with the timeline, a tornado scenario showing "Stay where you are" with no route button, then a flood route with the drawing animation, then a "Streetlight out" report with the success check.
- Write `DEMO_SCRIPT.md`: a 2:45 shot list for the phone (what to tap, in order, with timing), matching the required items in `CLAUDE.md` section 17 (my name, app name, one-sentence purpose, audience, tools and languages, AI disclosure, then the demo).
- Tips for me in `DEMO_SCRIPT.md`: use the phone's built-in screen recorder, Do Not Disturb on, full brightness, clean home screen, charged battery, restart the dev server and the app right before recording.

---

## 18. Documentation (update at the end, and keep notes as you go)

- `README.md`: the phone app section (what it is, how to run it in Expo Go, libraries and what each does).
- `NOTES.md`: decisions, final tokens with contrast ratios, performance measurements, problems and fixes (for example Expo Go limitations, map performance with many polygons, keeping animations at 60 fps by running them on the UI thread with Reanimated).
- `LEARNING.md`: plain-language explanations of React Native, Expo, Expo Go, the UI thread vs JavaScript thread, shared values and springs, haptics, design tokens, accessibility features.
- `FINAL_SUMMARY.md`: add the full phone app walkthrough (every screen, interaction and animation and why it exists), the one-brain-two-apps design, and likely judge questions with answers (for example "How do you keep animations smooth?" "How does the app decide Warning vs Danger?" "Why doesn't the tornado screen offer a route?").
- `SUBMISSION.md` and `AI_DISCLOSURE.md`: tools line "TypeScript, React Native and Expo (phone app), Vite (web app)," and an honest AI disclosure.
- The phone app is for testing and the demo only; it is not published.
