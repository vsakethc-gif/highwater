# HIGHWATER PHONE APP — VISUAL REDESIGN BRIEF ("Living Status")

Read `CLAUDE.md` and `MOBILE_BRIEF.md` first, then this whole file. **This file overrides `MOBILE_BRIEF.md` on visual style only:** palette, backgrounds, translucency, layout of each screen, tab bar, and signature animations. Everything else in `MOBILE_BRIEF.md` and `CLAUDE.md` still applies: reliability, data, safety wording ("never say safe"), Scenario Mode labeling, accessibility, Reduce Motion, haptics map, motion tokens, explaining every part in plain language, and the docs.

Do not break the web app. Do not change the data, engine or security code unless a screen needs a new field.

---

## How to work: the build loop for EVERY screen (read this first)

Two skill sets are installed. Use them on every screen, in this order, and report each step at the checkpoint:

1. **Plan with `expo-overview`** (routes to the right Expo skill) and **`expo-design-system`**: confirm tokens for this screen exist in the theme (add any from section 2 that are missing). No hardcoded colors, spacing or fonts.
2. **Build with `expo-native-ui`** (layout, native controls, effects, safe areas) and **`expo-router`** (navigation, sheets, headers). Follow this brief's layout for the screen.
3. **Animate with `expo-animation`**: implement only the motion this brief lists for the screen, following its decision order (should it animate, which thread, spring vs timing, gesture handoff, Reduce Motion fallback).
4. **Critique with `/impeccable critique`**: apply the findings that fit this brief's direction; ignore any that push toward a different style.
5. **Refine with `/impeccable layout` and `/impeccable typeset`**: fix cramped spacing, hierarchy and type. **The screen must feel spacious, not squished:** generous margins (20 pt screen padding minimum), clear gaps between modules (at least 16 pt), and one obvious focal point.
6. **Polish with `/impeccable polish`**, then re-run the **`expo-design-system` audit** for drift.
7. **Self-review** against sections 8 and 9, then stop for my phone test.

Before the feature freeze, run `/impeccable audit` on the whole app and fix anything that reads as AI-generated. Details on each skill are in section 11. If a skill isn't available, tell me instead of skipping silently.

---

## 0. Why we're redesigning and the approach

The current phone app works, but it doesn't look like the best apps on people's phones. We're going to **learn from apps that are clearly doing something right and combine their best patterns into our own design.** We borrow *patterns* (how a screen is laid out, how things move, how a gesture feels). We never copy *assets* (logos, icons, illustrations, artwork, exact color schemes, fonts we don't have rights to, or pixel-for-pixel screens). Every visual element here is drawn by us in code.

**Reference apps and what we take from each:**

| Reference | The pattern we borrow |
|---|---|
| **Apple Weather** | The home screen *is* the condition: a full-screen atmospheric background that changes with the situation, huge type, translucent info modules with small uppercase labels, a large header that condenses as you scroll |
| **Flighty** | Dark, premium, data-dense but calm; live status ribbons; progress timelines; numbers that tick; "you always know what's happening right now" |
| **Robinhood / Apple Stocks** | A clean full-width chart you scrub with your finger while the big number updates live |
| **Apple Maps / Citymapper** | Full-screen map with floating controls and a draggable sheet with three heights |
| **Citymapper** | Route options as swipeable cards with a compact segment bar, big travel time, and the matching line lighting up on the map |
| **Uber** | Request flows with one decision per screen, a pinned primary button, and a satisfying confirmation |
| **iOS severe weather alerts** | Urgent but calm: a bold colored header with an icon, a plain summary first, official text after |

If anything in this doc is unclear, search the web for descriptions or reviews of these apps' design patterns to understand the idea, then build our own version.

**Time:** it's Friday night 10/23. Build the Status screen tonight and **stop for my review on my phone** (section 9). The rest happens Saturday morning. Feature freeze Saturday ~2 PM; I record Saturday afternoon/evening; I submit Sunday. If we run out of time, follow the cut order in section 10.

---

## 1. The big idea: "Living Status"

The Status screen is a **living scene** whose whole look reflects the current hazard level:
- **Normal:** deep, calm night-blue water. Still and quiet.
- **Watch:** amber dusk. The water line sits a bit higher.
- **Warning:** burnt orange. The water line is high, gently moving.
- **Danger:** deep red. The water line is highest, with a slow glow pulse at the top of the screen.

Across the lower part of the scene runs **our water line**: a soft wave whose height rises with the level. If rain is forecast, fine rain streaks fall in the background, more for heavier rain. Information sits on top in translucent modules, like a weather app. This one idea makes the app memorable in a 3-minute video, fits a hazard app perfectly, and is ours.

**The app is dark-first.** The Status scene is always atmospheric. Other screens use the dark theme by default; keep the light theme working for people who prefer it (system setting), but design and polish dark first since that's what the video shows.

---

## 2. Visual system updates

### 2.1 Scene palettes (Status screen backgrounds)
Each level has a vertical background gradient, an accent, and a water tint. These atmospheric gradients are allowed **only** for the scene backgrounds; no gradient text, no purple/pink, no decorative gradients elsewhere.

| Level | Top | Bottom | Accent (text highlights, icons) | Water line tint |
|---|---|---|---|---|
| Normal | `#0F2C42` | `#061520` | `#8FD3C7` | `#2E6C93` at 55% |
| Watch | `#4A3512` | `#130D05` | `#F2C46B` | `#9C7428` at 50% |
| Warning | `#5C220E` | `#160805` | `#FF9F6E` | `#B4501E` at 50% |
| Danger | `#5E1020` | `#15040A` | `#FF8A9B` | `#B02A43` at 50% |
| Simulation overlay | add a thin dashed top border and the "SIMULATION" ribbon (section 3.2) in `#C7B8FF`; do not change the hue of the scene |

Text on scenes is white (`#FFFFFF` for primary, 72% white for secondary, 55% white for meta). Verify AA contrast against the lightest part of each gradient where text sits; adjust if needed and record the ratios in `NOTES.md`.

### 2.2 Dark surfaces (all other screens)
`bg #0A0F14`, `surface #121921`, `surfaceRaised #18212B`, `hairline rgba(255,255,255,0.08)`, `ink #EEF2F5`, `inkMuted #A3AFBA`, `inkFaint #7C8894`, `accent #6BB6E8`. Status fg colors from `MOBILE_BRIEF.md` (dark column) still apply for badges.

### 2.3 Translucent modules (Status screen only)
Modules on the scene use a frosted look: `expo-blur` BlurView (intensity ~30, dark tint) if supported in Expo Go, else `rgba(255,255,255,0.07)`; 1 px border `rgba(255,255,255,0.10)`; radius 18; padding 16. No shadows. This translucency is allowed only on the Status scene and map controls. Honor Reduce Transparency (switch to solid `surface`).

### 2.4 Typography (keep fonts, change the scale's feel)
- Keep **Public Sans** (UI) and **Newsreader** (display) unless they aren't loading reliably; if so, tell me.
- Status hero: level word in Newsreader 600 at **64 pt** (scales with Dynamic Type but caps on small phones), county name above it in Public Sans 600 17 pt, headline below in 17 pt 72% white.
- Module labels: Public Sans 600, 12 pt, uppercase, letter-spacing +0.6, 60% white, with a small icon before the label (Weather style).
- Numbers: tabular, Public Sans 600.

### 2.5 Icons
Keep Lucide at 1.75 stroke. Our own app icon and illustrations only.

---

## 3. Status screen (build tonight)

### 3.1 Layout (top to bottom)
1. **Live ribbon** (Flighty pattern), top safe area: a small pill: green-teal dot + "LIVE · Updated 3 min ago". States: "OFFLINE · from 2:14 PM" (amber dot), "MAY BE OUT OF DATE" (amber), "SIMULATION" (violet, section 3.2). Tapping it shows data sources and times in a sheet.
2. **Hero** (Weather pattern): county name with a small chevron (opens county picker sheet) and location icon if from GPS; the giant level word ("Warning"); the hazard ("Flooding") with its icon; the one-line headline from triggers ("Flood Warning for the Catawba River near Rock Hill until 8 PM"). Under it, a single line of quiet context: "Rain next 24 h: 2.1 in · 3 rivers rising".
3. **The scene:** background gradient + water line + optional rain, behind everything (section 4).
4. **Modules** (translucent cards, in this order; each has an icon + uppercase label):
   - **WHY THIS STATUS:** up to 3 trigger rows, each with source and time; "See all" opens the detail.
   - **WHAT TO DO NOW:** the interactive checklist (animated checks). For shelter-in-place hazards, first item "Stay where you are and take shelter" and no route button.
   - **RIVERS NEAR YOU:** gauge rows like Weather's hourly strip but vertical: name, mini water-fill bar, reading, trend arrow, stage label. Tap expands into Gauge detail.
   - **ALERTS:** active alerts as rows with a Flighty-style **time bar** (a thin bar from start to end with a dot at "now" and labels "Started 2:10 PM · Ends 8:00 PM").
   - **RAIN:** next 24/48 h bars growing in, with totals.
   - **ACTIONS:** two side-by-side modules: "Plan a route out" (only when leaving makes sense) and "Report a problem"; then "Open map".
   - **Footer:** "Not an official warning system. In an emergency, call 911." with a "Call 911" text button, and "How this works ›".
5. **Floating tab bar** (section 7).

### 3.2 Scroll behavior (Weather pattern)
- As you scroll up, the hero **condenses**: the giant level word shrinks and slides into a compact top bar ("York County · Warning · Flooding"), the headline fades out, and the scene darkens slightly (overlay opacity grows with scroll). Scroll back down and it expands again. Drive it with a Reanimated scroll handler and interpolation, 1:1 with the finger.
- Module labels stick briefly at the top while their module scrolls under them (optional; skip if it hurts performance).
- **Pull to refresh:** the water line rises as you pull; at the threshold, a ripple runs across it and `impactLight`; while loading, the wave moves slowly; on finish, it settles back.

### 3.3 Level-change transition (signature moment)
When the level changes (live data or Scenario timeline):
1. The background gradient crossfades to the new palette (`slow`, 400 ms; use two stacked gradient layers and animate opacity).
2. The water line animates to its new height with a `gentle` spring and a brief bigger wave.
3. The level word crossfades and slides up 8 pt; the hazard icon morphs/crossfades.
4. Haptic per `MOBILE_BRIEF.md` (warning/error notifications).
5. Screen reader announcement.
With Reduce Motion: a plain 200 ms crossfade, no movement.

### 3.4 Simulation look
When Scenario Mode is on, the live ribbon becomes a violet "SIMULATION · not live data · Exit" ribbon, the scene gets a thin dashed violet line along the top edge, and the **Scenario timeline** docks above the tab bar (a translucent bar with play/pause, a scrubber with tick marks where levels change, and the simulated time "Sept 27 · 4 AM"). Dragging it changes the scene live (section 3.3), so a viewer sees Normal → Watch → Warning → Danger by sliding a finger. This is the hero shot of the video.

---

## 4. The scene, technically

- Build `<StatusScene level rain progress />` in `/mobile/components/scene/`.
- **Background:** two stacked `expo-linear-gradient` layers (current and next) for crossfades.
- **Water line:** an SVG or Skia path across the full width with 2 overlapping wave layers (different speeds and amplitudes, low opacity), animated with Reanimated shared values on the UI thread. Height per level: Normal 18% of screen height from the bottom, Watch 26%, Warning 34%, Danger 42%. It sits behind the modules (modules scroll over it).
- **Rain:** only when forecast rain in the next 24 h ≥ 0.25 in. 30 to 80 thin streaks (scaled by amount) falling at a slight angle, low opacity, using a single animated layer (Skia preferred; otherwise a few Animated.Views with transforms). Must stay at 60 fps; if it can't, reduce the count or drop it.
- **Danger glow:** a soft radial-looking glow at the top (a large blurred circle or gradient) whose opacity breathes 0.25 ↔ 0.4 over 2 s.
- **Reduce Motion:** static waves, no rain motion (show a few static streaks or none), no glow pulse.
- **Battery/perf:** pause all scene animation when the screen is not focused or the app is in the background.

---

## 5. Other screens (Saturday morning)

### 5.1 Gauge detail (Robinhood / Stocks pattern)
- Opens by expanding from the tapped row (or a standard push if time is short).
- Top: gauge name, river, county, "PROVISIONAL · USGS · 6 min ago".
- **Big number** (48 pt tabular) with unit and trend ("12.4 ft ▲ 0.6 ft in 3 h"), stage label pill.
- **Full-width line chart**, no grid clutter: the line colored by stage (normal teal → watch amber → warning orange → danger red where it crosses those levels), dashed horizontal flood-stage lines labeled at the right edge ("Minor 14 ft").
- **Scrub:** press and drag anywhere on the chart; a vertical hairline and dot follow the finger, the big number and time update live, `selection` haptic when crossing a stage line; release snaps back to now with a spring.
- **Range selector** under the chart: "24H 48H 7D" text tabs with a sliding underline.
- Below: stats row (24 h high, 24 h change, distance to next stage), "What this means" plain text, small map.

### 5.2 Map (Apple Maps / Citymapper pattern)
- Dark map style. Floating rounded **search pill** at the top (translucent), a vertical stack of **floating round controls** on the right (layers, recenter), all translucent with hairline borders.
- **Sheet** with three heights (peek ~120 pt, half, full). Peek shows the district summary ("2 warnings · 5 rivers rising · 1 open shelter"). Selecting anything updates the sheet content with a crossfade and raises it to half.
- Layer chips inside the sheet's top (horizontal), not over the map, to keep the map clean.
- Markers: circular gauge markers with a level ring; alert polygons with soft level-colored fill and crisp outline; selected marker scales up, others dim.
- Fly-to camera animations; markers pop in once on first load.

### 5.3 Alerts (iOS severe alert pattern)
- Header band in the level's color with the hazard icon and event name ("Flood Warning"), and the Flighty-style time bar.
- "In plain words" summary first (from our rules), then "What to do", then the official text in an expandable section, then "View official alert" link.

### 5.4 Route (Citymapper pattern)
- Persistent safety note at top (not dismissible, compact).
- From/To fields; destination quick-pick tiles ("Nearest open shelter", "Away from the warning area", "Choose a place").
- Results: map on top; **route cards carousel** at the bottom. Each card: big travel time, "+6 min vs fastest", a compact **segment bar** showing parts of the route that are normal vs. in a flood zone (striped) vs. passing an active warning area (should be none for the lower-exposure route), and small facts (distance, flood-zone crossings, nearby reports). The focused card's line glows on the map while others dim; swiping syncs the map.
- Route lines draw along their path when results arrive.

### 5.5 Report (Uber pattern)
- One decision per screen with a thin progress bar at the top and a **pinned primary button** at the bottom.
- Step 1: big category tiles (2-column grid, icon + label). Downed power line opens the emergency screen instantly.
- Step 2: map with a fixed center pin that lifts while dragging and drops on release; street name shown in a pill.
- Step 3: optional note + privacy hint + Turnstile.
- Success: full-screen confirmation with a large animated check drawing in, `notificationSuccess`, and the official "also report it here" links.
- "Near me" list: rows with swipe actions ("Still there" / "Fixed") plus visible buttons.

### 5.6 Onboarding (shows off the big idea)
Three pages over the living scene: page 1 shows the scene at Normal ("Know what's happening near you"), page 2 transitions the scene to Warning as you swipe ("Clear steps when it matters"), page 3 asks for location ("Your location stays on your phone"). Swiping scrubs the scene transition with your finger. Skippable; shown once.

### 5.7 More
Dark grouped list (iOS Settings pattern) with icon tiles; Scenario Mode at the top as a prominent card ("Replay a storm").

---

## 6. Motion (on top of `MOBILE_BRIEF.md` tokens)

Must-have signature moments, in priority order:
1. Status level-change transition (3.3) and scene water line + rain (4).
2. Hero condensing on scroll (3.2).
3. Scenario timeline scrubbing the scene (3.4).
4. Skeleton → content crossfade and one-time staggered module entrance (modules rise 12 pt and fade in, 40 ms stagger).
5. Press feedback everywhere (scale 0.97, `snappy`).
6. Gauge chart scrub (5.1).
7. Route line draw + card/map sync (5.4).
8. Report success check (5.5).
9. Sheet springs and map fly-to (5.2).
10. Tab bar selection animation (7).

Rules from `MOBILE_BRIEF.md` still apply: UI thread, 60 fps, one-time entrances, no delay on emergency info, Reduce Motion honored.

---

## 7. Floating tab bar
A floating, rounded (radius 28) translucent bar inset 16 pt from the sides and above the home indicator: five icons with short labels; the selected tab shows a soft pill highlight that **slides** between tabs (`snappy`), icon switches to filled/brighter, `selection` haptic. On the Status scene it picks up the scene's tint. Content scrolls under it with enough bottom padding.

---

## 8. "Not vibe-coded" rules for this redesign
- Every screen must clearly show which reference pattern it uses (list it in your checkpoint notes) but must not look like a copy of that app.
- No default components left anywhere (no default buttons, headers, switches styled as-is unless they're the native platform switch).
- No identical card everywhere: the Status uses translucent modules, other screens use dark grouped lists, sheets and full-bleed visuals.
- Specific local copy, designed states, consistent tokens, aligned icons.

---

## 9. Checkpoint tonight (stop here and show me)
After building the Status screen with the scene:
1. Tell me how to open it in Expo Go.
2. Give me a **phone test checklist**: open Scenario Mode and drag the timeline (scene should shift Normal → Danger with haptics); scroll (hero should condense); pull to refresh (water should rise and ripple); turn on Reduce Motion (everything becomes simple fades); check rain appears in a rainy scenario.
3. List anything you simplified and why.
Wait for my feedback before moving on to the other screens.

---

## 10. Cut order if time runs short (tell me before cutting)
1. Onboarding scene scrubbing (use simple pages over a static scene).
2. Contextual expand into Gauge detail (use standard push).
3. Route segment bar (show text facts instead).
4. Rain particles (keep the water line).
5. Map sheet content crossfades (instant swap).
**Never cut:** the living scene with the water line and level colors, the level-change transition, the Scenario timeline, the hero condensing on scroll, press feedback, reliability, safety wording, accessibility basics.

---

## 11. Design skills to use (installed by me)

### 11.1 Official Expo skills (primary for the phone app)
I'm installing the official **Expo plugin** for Claude Code. Use its skills for all phone-app work:
- **`expo-native-ui`** for native-feeling screens (platform styling, semantic colors, native controls, visual effects).
- **`expo-animation`** for every animation, gesture, sheet and haptic (Reanimated, Gesture Handler, Expo Router, expo-haptics), within section 6 and the Reduce Motion rules.
- **`expo-design-system`** to keep our tokens and shared components consistent, and to **audit the app for hardcoded colors, spacing and fonts** before each checkpoint.
- **`expo-router`** and **`expo-data-fetching`** where relevant.
- `expo-ui` (SwiftUI/Jetpack Compose components) only if it works in **Expo Go** for our SDK; if it needs a development build, don't use it.
Where an Expo skill's defaults conflict with this brief's look (for example default system colors), this brief wins on look; the Expo skill wins on how to implement it correctly.

### 11.2 Impeccable (taste and critique)
I'm also installing **Impeccable** (open-source design skill for Claude Code by Paul Bakaus, Apache 2.0; commands run as `/impeccable <command>`). Use it as a design reviewer and polisher alongside this brief:
- If `/impeccable init` asks for design context, use **this file** as the source of truth (Living Status direction, scene palettes, type, spacing, motion). Don't let it replace our direction with a different one.
- Impeccable is web-focused; its automated detectors scan HTML and URLs. Apply its **principles and command guidance** to the React Native code, and run its automated checks on the **web app** (`https://vsakethc-gif.github.io/highwater/`) where they work.
- Workflow per screen: build it from this brief → `/impeccable critique` → fix what it finds → `/impeccable layout` and `/impeccable typeset` if spacing or type feel off → `/impeccable animate` for motion (within section 6 and Reduce Motion rules) → `/impeccable polish` as the final pass. Before the freeze, run `/impeccable audit` and fix anything that makes it look AI-generated.
- Avoid `bolder` and `overdrive` unless I ask: the goal is calm and premium, not flashy.
- Tell me which Impeccable findings you applied in each checkpoint.

## 12. Docs
Update `NOTES.md` (references used and patterns borrowed, scene implementation, performance numbers, problems and fixes), `LEARNING.md` (how the scene animation works, UI thread), `FINAL_SUMMARY.md` (the "Living Status" design idea and why it fits a hazard app; which apps inspired which patterns, in our own words), and `DEMO_SCRIPT.md` (lead with the Scenario timeline shifting the scene).
