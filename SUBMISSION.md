# Submission drafts

_These are drafts for you to rewrite in your own words. Judges want to hear **you**. Check the 2026 Congressional App Challenge rules and the exact form questions before submitting (deadline Monday, October 26, 2026; you plan to submit Sunday, October 25)._

**Live app:** https://vsakethc-gif.github.io/highwater/
**Source code:** https://github.com/vsakethc-gif/highwater

---

## App name

**Highwater**

## One-sentence description

Highwater is a free web app that shows people in South Carolina's 5th District what hazards are near them right now, what to do about them, how to find a lower-exposure way out when leaving makes sense, and how to report broken or dangerous things in their neighborhood.

## Target audience

Residents of SC-5's eight counties (Cherokee, Chester, Fairfield, Kershaw, Lancaster, Lee, Union, and York), and especially the people who have the hardest time in a disaster: older adults, households without a car, and families with lower incomes. It is built to work on an old or cracked phone in bright sun, with a weak signal, and with a keyboard or screen reader.

## Why I built it (draft, make it personal)

When a storm hits, the information people need is scattered across a dozen government websites: river gauges at USGS, warnings at the National Weather Service, flood maps at FEMA, shelters on another FEMA map. Most people won't dig through all of that while water is rising. In late September 2024, Hurricane Helene's remnants flooded rivers across the Carolinas. _(Add your own experience or what you saw in York County.)_ I wanted one simple page that pulls it together, tells you in plain words what's happening where you live, and points you to the officials and 911 first.

## How the app works (plain English)

1. **Data in.** The app reads live, public data from the National Weather Service (every official alert, and the rain forecast), the U.S. Geological Survey (river and stream levels from 39 gauges in SC-5), and FEMA (flood zones and open shelters). Census data on who lives where, and county and neighborhood boundaries, are prepared ahead of time by scripts.
2. **Rules.** A set of written rules (no AI) turns that data into one of four levels for each hazard: **Normal, Watch, Warning, or Danger**. For example, a Tornado Warning is "Warning," a gauge above its official minor flood stage is "Warning," and 2 inches or more of forecast rain in 24 hours is "Watch." If data fails to load, the app says it **can't confirm** instead of showing an all-clear.
3. **What you see.** A status card with "Why this status?" (every reason, with its source), plain-language steps for that exact hazard and level, a district map, and a printable "Get ready" checklist.
4. **Route planner.** During a flood or hurricane warning, it asks a routing service for the fastest route and alternatives that avoid active warning areas, then scores each route (minutes, plus penalties for entering warning areas and crossing FEMA flood zones). During a tornado warning there is **no route button**: the app says to take shelter where you are, because driving into a tornado is dangerous.
5. **Community reports.** Anyone can report a streetlight out, a flooded road, or a downed tree, without an account or personal information. Reports are public and labeled unverified, expire automatically, and come with the official link to get the problem fixed.

## Tools and languages

- **Languages:** TypeScript (the app and server code), HTML and CSS (pages and design), SQL (the database and its security rules), JavaScript (data-building scripts).
- **Main tools:** Vite (builds the site), Vitest (159 automated tests), MapLibre (the map), GitHub Pages (hosting), a Cloudflare Worker (the one small server piece), Supabase (the reports database), Cloudflare Turnstile (spam protection).
- **AI disclosure:** I used Claude, an AI coding assistant, which wrote most of the code under my direction. My role is described in [AI_DISCLOSURE.md](AI_DISCLOSURE.md). The app itself uses no AI.

## Technical challenges (pick one or two and tell them in your own words)

1. **Avoiding danger areas within a free service's limits.** The free routing service only accepts "avoid areas" up to 20 km across, but flood warning areas are often much bigger. We cut each warning area into tiles about 14 km on a side and send only the tiles near the trip. Then a second problem: if you're standing *inside* the warning area, the router can't avoid where you already are and fails. The fix was to leave out the tiles containing the start and destination and tell the person they're starting inside a warning area. Our first scoring formula also couldn't tell routes apart (they all "passed through" the area you start in), so we changed it to count areas a route *enters* plus miles driven inside them.
2. **Cancelled warnings that still looked active.** The weather service feed includes messages that *cancel* a warning, and they still carry the event name "Flood Warning." Without care, the app would have warned people about floods that were already over. We read a hidden code in each message (VTEC: NEW, CONTINUED, CANCELLED, EXPIRED...) and ignore cancelled and expired ones. A saved real cancelled warning is in the tests.
3. **A public form with no accounts, that bots can't flood.** Reports needed no name or email, but still had to stop spam. The solution has layers: Cloudflare's "I'm human" check, a server check of the category, location (must be in SC-5), length, and personal info like phone numbers, and a database limit of 5 reports per device per hour. The "device" is a random ID that is scrambled (hashed) with a secret, so we can count reports without knowing who anyone is. The database itself only lets the public *read* active reports.
4. **Never showing a false all-clear.** We blocked each data source on purpose in a test browser to see what people would get when it's down. Two screens said "No active reports nearby" and "No active warning areas" when really the data hadn't loaded. Both now say "couldn't load," and the main status says "can't confirm" instead of "Normal."
5. **A government data source retiring during judging.** USGS announced its main river-level service would start shutting down in November 2026, right when judges test the app. We built on the new USGS API and kept the old one only as an automatic backup.

## Demo video outline (target 2:45; never over 3:00; upload as **public** on YouTube or Vimeo)

Record on your phone screen if you can (it's a phone-first app). Turn on **Scenario Mode** only when you say so out loud, so judges see the "SIMULATION" banner is deliberate.

| Time | What to show | What to say (in your own words) |
|---|---|---|
| 0:00–0:20 | You on camera, or the home screen | Your name, "Highwater," one sentence on what it does, who it's for (SC-5 residents, especially older adults and people without a car), and "built with TypeScript, HTML, CSS, and SQL; I used an AI coding assistant, Claude, and my disclosure is in the repo." |
| 0:20–0:35 | Weather or river photo, or the district map | The problem: hazard information is scattered across many agencies, and the people with the fewest resources have the least time to find it. |
| 0:35–0:55 | Status page, York County, live | "This is live data right now." Point out the status, "Why this status?", and a river gauge with its flood stage and sparkline. |
| 0:55–1:20 | Scenario mode → "River flood warning in York County" | The SIMULATION banner; status jumps to Warning; open "Why this status?" (gauge above flood stage); guidance includes "Turn around, don't drown." |
| 1:20–1:40 | Scenario → "Tornado warning in Lancaster County" | No route button. Explain: leaving during a tornado is the wrong advice, so the app says to take shelter on the lowest floor in an interior room. |
| 1:40–2:05 | Scenario → "Flash flood emergency in Fort Mill and Rock Hill" (status: Danger) → Plan a route out → type ZIP **29715** → "Away from the warning area" → Plan routes | Tested Oct 18: three routes out of the warning area to Van Wyck. Point at "You're starting inside an active warning area," and compare miles inside warning areas (4.4 vs 7.2 vs 8.1) and flood zones crossed. Never say "safe route." (If a real shelter is open that day, you can show "Nearest open shelter" instead.) |
| 2:05–2:25 | Turn Scenario Mode **off** → Report a problem → Streetlight out | Pick the spot, send (it's real now), then show the "get it fixed" links to Duke Energy / SCDOT. Mention: no name, no email, unverified. |
| 2:25–2:35 | How it works page | "Every rule is written out here. It's transparent, not a black box." |
| 2:35–2:50 | You | What you learned (pick one real moment from NOTES.md), and that it's free for anyone in SC-5. |

Tips: practice with a timer; cut pauses; keep the screen recording zoomed so text is readable; check the final file is under 3:00 before uploading.

## Before you submit (checklist)

- [ ] Read the 2026 rules and form questions; adjust these drafts to fit.
- [ ] Rewrite every answer above in your own words.
- [ ] Re-read [AI_DISCLOSURE.md](AI_DISCLOSURE.md) and correct anything that isn't accurate.
- [ ] Fill in the "What I did" lines in [LEARNING.md](LEARNING.md).
- [ ] Open the live app on your phone: Status, District map, Route, Report, Get ready, How it works, About, and Scenario Mode.
- [ ] Record, trim to under 3:00, upload as **public**, and paste the link into the form.
- [ ] Optional: set up your admin login (NOTES.md → "Later") so you can hide bad reports during judging.
