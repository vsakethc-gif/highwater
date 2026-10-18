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

## 5. It must feel native and look clean (not vibe-coded)

- Follow the `CLAUDE.md` design system and "never" list. Same calm civic-data look, same status colors, icon + label for every status.
- Respect safe areas (notch, home bar), set the status bar color, and use native-feeling navigation, transitions, and gestures.
- Add an app icon and splash screen in our design style.
- Support system text size (Dynamic Type / font scaling) without breaking layouts.
- Accessibility: `accessibilityLabel` and `accessibilityRole` on every control, screen-reader announcements when status changes, touch targets at least 44 pt, no information by color alone.
- Light haptic feedback on key actions (for example submitting a report) is fine if supported; keep it subtle.
- Every state designed: loading skeletons, empty, error, stale, offline, no gauges, no open shelters, routing unavailable, reports unavailable, location permission denied.

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
