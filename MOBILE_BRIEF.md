# NATIVE MOBILE APP BRIEF (add-on to CLAUDE.md)

Read `CLAUDE.md` first, then this file. Everything in `CLAUDE.md` still applies (safety wording, free-only, no live AI, design rules, accessibility, explaining every part in plain language). This file adds a **real native mobile app**, built with **React Native + Expo**, that I run on my own phone with **Expo Go** for testing and for recording my submission video. **We are NOT publishing to any app store.**

The finished web app stays exactly as it is and keeps working. It remains the backup for the submission. Do not break it.

---

## 1. Goal and constraints

- A true native app (native screens, native map, native navigation), not a website inside an app shell. **Do not use a full-screen WebView to show the website.**
- Runs in **Expo Go** on my phone (iPhone or Android) by scanning a QR code. This must work without a Mac and without any paid Apple or Google developer account.
- Before adding ANY library, check that it is supported in Expo Go for the current Expo SDK version. If it isn't, find an Expo Go–compatible alternative. Do not switch to a custom development build unless I approve it, because iOS development builds need a paid Apple account.
- Free only. Reuse the same Cloudflare Worker, Supabase project, and data sources as the web app.
- Deadline: I record the demo video on **Friday 10/23** and submit **Sunday 10/25**.

## 2. Architecture: reuse the logic, rebuild only the screens

- Create the app in `/mobile` (Expo, TypeScript, Expo Router for navigation).
- **Share, don't copy, the app's brain.** Move the pure logic that has no browser/DOM dependencies (hazard engine and mapping table, flood rules, vulnerability/exposure math, guidance rules and copy, route scoring, avoid-area building, report validation, data parsers, types, config) into a shared folder (for example `/shared`) that both the web app and the mobile app import. Do this refactor carefully: run all existing tests before and after, and confirm the web app still builds and deploys unchanged.
- Anything that touches the browser (DOM, `localStorage`, service workers, Leaflet/MapLibre, `navigator.geolocation`) stays in the web app and gets a native equivalent in `/mobile`.
- Explain this split to me in plain language. It's a strong "technical challenge" story: one engine, two front ends.

## 3. Web → native equivalents (verify each is Expo Go–compatible)

| Web app uses | Native app should use |
|---|---|
| Leaflet / MapLibre web map | `react-native-maps` (Polygons, Polylines, Markers; Apple Maps on iOS, Google Maps on Android in Expo Go) |
| `navigator.geolocation` | `expo-location`, with the permission message: "Used to show hazards and routes near you. Your location is not stored." |
| `localStorage` / service worker offline | `@react-native-async-storage/async-storage` (and `expo-file-system` if needed) to cache the last status, guidance, and checklists for offline use |
| Lucide web icons | `lucide-react-native` (with `react-native-svg`) |
| Web fonts | `expo-font` with the same font families as the web app |
| CSS tokens | a `theme.ts` with the same colors, spacing, type scale, and radii as `tokens.css` |
| Bottom sheet / side panel | `@gorhom/bottom-sheet` (needs Reanimated + Gesture Handler) or a simple native modal if that's unsupported |
| Cloudflare Turnstile | Turnstile has no native SDK. Try rendering the Turnstile widget inside a small `react-native-webview` only for the check. If that doesn't work reliably, tell me the options before changing the security model. |
| Tap-to-call 911 / utility | `Linking.openURL('tel:...')` |
| Open route in Maps | `Linking` to Apple Maps / Google Maps URLs |
| Print/save route | Native share sheet (`expo-sharing` or `Share`) with a text summary |

Push notifications are **out of scope** (Expo Go limits remote push). Do not add them.

## 4. Screens and navigation

A bottom tab bar with five tabs, each with an icon and a text label:
1. **Status:** location picker, hero status card, active hazards, "Why this status?", guidance, nearby gauges with sparklines, rain forecast, pull-to-refresh.
2. **Map:** full-screen native map with layer toggles (alerts, gauges, vulnerability, flood exposure, priority, shelters, reports) and a legend. Tapping a tract or marker opens a bottom sheet with details.
3. **Route:** the lower-exposure route planner with all the safety framing from `CLAUDE.md` section 10. It is hidden for shelter-in-place hazards (tornado, severe storm, extreme cold), which show shelter-in-place guidance instead.
4. **Report:** the report flow from `CLAUDE.md` section 11, including the downed-power-line emergency screen, plus "Reports near me."
5. **More:** Scenario Mode toggle, Methodology, About, Privacy, Limitations.

Scenario Mode must work in the native app too, with the same persistent "SIMULATION — not live data" banner on every screen, and nothing written to the database while it's on.

## 5. Premium look and motion: this app must look and feel like a top App Store app

This section **overrides the "minimal motion" rule in `CLAUDE.md` for the native app only.** The goal: when judges watch my video, the app should look as smooth and polished as the best apps on their own phones (think of the polish level of Apple Weather, Citymapper, or Things; take inspiration from the quality, never copy their designs or assets). Clean, calm, and credible stays the foundation; the motion and depth make it feel premium. Never let style slow down emergency information.

### 5.1 Visual foundation
- Keep the `CLAUDE.md` palette, typography, and "never" list (no purple gradients, no gradient text, no emoji icons, no template card grids, no neon).
- Native apps may use **soft depth**: very subtle shadows/elevation on cards and sheets, and native blur only where the OS uses it (tab bar, sticky headers, map controls). Keep it restrained.
- Generous spacing on an 8 pt grid, large confident headings, tabular numbers, crisp icons at one stroke weight.
- **Dark mode** is in scope for the native app (polished apps have it). Design both themes from the same tokens; test contrast in both.
- Custom app icon and an animated splash-to-home transition in our style.
- A short, skippable **3-screen onboarding** (what the app does, location permission explained, "not an official warning system / call 911"), shown once. Good for the video.

### 5.2 Motion system (define once in `/mobile/theme/motion.ts`, use everywhere)
- Use **`react-native-reanimated`** (animations run on the UI thread for 60 fps) and **`react-native-gesture-handler`**. Optional helpers if Expo Go supports them for our SDK: `moti`, `lottie-react-native`, `@shopify/react-native-skia`, `expo-haptics`, `expo-blur`. Verify each before using.
- Motion tokens: durations (fast 150 ms, base 250 ms, slow 400 ms), standard easing curves, and 2 to 3 named spring configs (gentle, snappy). No random one-off values.
- Rules: animate only `transform` and `opacity` where possible; no layout jank; every gesture-driven animation follows the finger and can be interrupted; nothing blocks input; nothing loops forever except the subtle Danger indicator.
- **Respect Reduce Motion** (`AccessibilityInfo.isReduceMotionEnabled` / Reanimated's reduced-motion support): swap movement for simple fades.
- **Emergency rule:** the 911 button, Danger status, and power-line warning appear instantly with no entrance delay. Animation can follow, never precede, critical info.

### 5.3 Signature animations (build these; they're what makes the video look great)
1. **Status card:** when the level changes, the card's color and icon morph smoothly between levels, the headline crossfades, and a short haptic plays (light for Watch, medium for Warning, heavy for Danger). At Danger, a slow, subtle pulse on the status icon only.
2. **River gauge visual:** each gauge shows an animated water-level fill (a smooth rising fill with a gentle wave edge, drawn with SVG or Skia) relative to its flood stages, plus a sparkline that draws itself in from left to right on first view.
3. **Skeleton loading:** soft shimmer placeholders shaped like the real content, then a smooth crossfade into real data. No spinners on blank screens.
4. **Lists:** staggered fade-and-rise entrance for alerts, gauges, reports, and route steps (short stagger, about 30 to 50 ms per item, only on first appearance).
5. **Pull to refresh:** a custom water-ripple or rising-water indicator in our style, with a haptic tick when refresh triggers.
6. **Tab bar:** icons animate on select (small scale and fill change), with a smooth sliding indicator.
7. **Buttons and cards:** press-in scale (about 0.97) with a quick spring back, plus a light haptic on primary actions.
8. **Bottom sheets:** spring-driven, draggable, with snap points and a dimmed backdrop that fades with the drag.
9. **Map:** smooth camera fly-to when choosing a county or place; layers fade in when toggled; markers pop in with a small spring; tapping a marker smoothly raises its sheet.
10. **Route reveal:** the route line draws itself along the path on the map, and the route cards slide up in order (fastest, then lower-exposure). The selected route highlights while others fade back.
11. **Report flow:** category tiles respond to touch; steps slide between each other; on submit, an animated checkmark (Lottie or drawn SVG) with a success haptic.
12. **Scenario Mode:** the "SIMULATION — not live data" banner slides in from the top and stays; the app's accent shifts subtly so it's obvious you're in simulation.
13. **Screen transitions:** native stack transitions, and a smooth shared-element-style transition from a list item (for example a gauge) into its detail screen where supported.
14. **Number changes:** values like river height and rain totals count up/down smoothly when they update.

### 5.4 Native feel and accessibility (still required)
- Respect safe areas (notch, home bar, Android navigation bar), set status bar style per theme, use platform-appropriate navigation and gestures (swipe back on iOS, back button on Android).
- Support system text size (Dynamic Type / font scaling) without breaking layouts.
- `accessibilityLabel` and `accessibilityRole` on every control, screen-reader announcements when status changes, touch targets at least 44 pt, no information by color alone, Reduce Motion honored.
- Every state designed and animated in: loading skeletons, empty, error, stale, offline, no gauges, no open shelters, routing unavailable, reports unavailable, location permission denied.

### 5.5 Polish pass and quality bar
- Animations must hold 60 fps on my real phone. If something stutters, simplify it rather than ship it.
- After each phase, give me a short checklist of exactly what to look at on my phone (for example "pull down on Status: you should see the water ripple and feel a tick") so I can report anything that feels off.
- Do a dedicated **motion and visual polish pass on Thursday 10/22**: consistent timing everywhere, no leftover default styles, aligned spacing, both themes checked.
- Record in `NOTES.md` which animation libraries you used and why, and explain in plain language how Reanimated keeps animations smooth (UI thread vs JavaScript thread). That's good material for judges.

### 5.6 It must NOT look vibe-coded (hard requirement)
AI-generated apps have recognizable "tells." Avoid every one of these:
- Default system blue buttons, default fonts, default React Native/Expo template screens or colors left in.
- Every screen built from the same rounded white card stacked in a column with identical padding.
- Generic hero sections, big emoji, stock illustrations, filler welcome text, or "AI-powered" anything.
- Purple/indigo gradients, gradient text, glowing borders, glassmorphism everywhere.
- Random, inconsistent spacing, radii, shadows, or font sizes (if a value isn't a token, it's wrong).
- Animations that are all the same fade, or that bounce for no reason, or that play every time you revisit a screen.
- Icons from mixed sets or mixed stroke widths; misaligned icons and text.
- Placeholder-feeling copy ("Lorem," "Item 1," "Click here," "Something went wrong").
- Center-aligned everything, and walls of text with no hierarchy.

Instead, make it feel **designed on purpose**:
- **A clear visual identity:** one signature element that ties the app together (for example the water-level motif used in the gauge fills, the pull-to-refresh, the splash, and the status card), used consistently but not overused.
- **Real hierarchy on every screen:** one obvious most-important thing, then supporting info. Vary layout by purpose (a hero status, a dense data list, a full-bleed map, a focused step-by-step flow) instead of the same card everywhere.
- **Purposeful motion:** each animation explains something (where an item came from, what changed, what's happening). Animations play on meaningful events, not on every render.
- **Specific, human copy** written for SC-5 residents ("Catawba River at Rock Hill is 2.1 ft below flood stage and falling").
- **Details that show care:** consistent optical alignment, proper empty states with a short helpful line, sensible defaults, remembered choices (last county), and nothing that jumps when data loads.

### 5.7 Smart transitions and interactivity
Make the app feel alive and responsive to touch, not like a static page:
- **Context-aware transitions:** tapping a gauge expands it into its detail screen from where it sat; opening a hazard slides its guidance in from the card; the map zooms to what you tapped. Going back reverses the motion.
- **Interactive gauge detail:** drag a finger along the gauge chart to scrub through time, with a moving marker, the exact reading and time shown, and light haptic ticks when crossing a flood-stage line.
- **Scenario Mode timeline:** a draggable timeline slider that replays the simulated event (for example Helene) hour by hour, with the status card, gauges, and map updating live as you drag. This is a strong demo moment.
- **Interactive checklist:** the "Do this now" guidance items can be checked off with a satisfying animated check; progress is remembered on the device.
- **Swipe and long-press:** swipe a report to mark "Still there" or "Fixed"; long-press a gauge or alert for a quick-look preview.
- **Map interactions:** pinch, pan, and tap feel native; layer toggles are a smooth segmented control or chips with a sliding highlight; tapping a tract shows a sheet whose content animates in.
- **Route comparison:** swipe between route cards and the map highlights the matching route in sync.
- **Live feedback:** controls respond within one frame (press states, haptics); anything that loads shows progress in place.
- Keep every interactive feature reachable without gestures too (buttons and accessibility actions), so screen-reader and switch users can use it.

### 5.8 Self-review before showing me any screen
Before each checkpoint, review every new screen against sections 5.1 to 5.7 and list for me: what signature motion it has, what interaction it has, and anything you consider "vibe-coded" that you fixed. If something only looks okay, keep improving it before calling it done.

## 6. Performance on a phone

- Tract polygons can be slow in `react-native-maps`. Use simplified geometry, and if it's still slow, draw tracts only for the selected county and use county-level shading for the district view. Measure and tell me what you chose.
- Cache static data on the device after the first load.
- Test on my real phone through Expo Go, not just a simulator.

## 7. Phases (stop and show me at each checkpoint)

| When | Goal |
|---|---|
| Mon 10/19 | Expo app set up in `/mobile`; shared logic refactor with all tests passing and the web app still working; Status tab with live data running on my phone in Expo Go. |
| Tue 10/20 | Map tab with layers, legend, and bottom-sheet details. Scenario Mode. |
| Wed 10/21 | Route tab with the Worker/ORS routing and shelters. |
| Thu 10/22 | Report tab with Supabase and the Turnstile solution. Offline cache. Design and accessibility polish. **Cut-rule check:** if a tab isn't solid by Thursday night, hide it behind a feature flag and tell me. |
| Fri 10/23 | Final polish on my phone; I record the demo video. |

At each checkpoint, give me exact steps to open the latest version on my phone, a short plain-English summary, what to test, and a 3-question quiz.

## 8. Running it on my phone (walk me through this, assuming I've never done it)

- Install Expo Go from the App Store or Google Play.
- Start the dev server and show me how to scan the QR code (Camera app on iPhone, Expo Go on Android).
- Explain what to do if my phone and computer aren't on the same Wi-Fi (for example tunnel mode), and how to fix common errors.
- Explain that this only runs while the dev server is running on my computer, and how to restart it before recording the video.

## 9. Documentation updates

Update `README.md`, `NOTES.md`, `LEARNING.md`, `FINAL_SUMMARY.md`, `SUBMISSION.md`, and `AI_DISCLOSURE.md` to cover:
- What React Native, Expo, and Expo Go are, in plain language, and why we chose them.
- The shared-engine design (one brain, two apps).
- Every new library and what it does.
- That the mobile app is for testing and the demo only, not published.
- The demo video tools line: "Built with TypeScript, React Native and Expo for the mobile app, and Vite for the web app," plus the AI disclosure.
- Any Expo Go limitations we hit and how we handled them (good technical-challenge material).
