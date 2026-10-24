# AI disclosure

Read this carefully and change anything that doesn't match what really happened. It has to stay accurate. Items marked **[CHECK]** or **[ADD YOURS]** need me.

## Short version (for the form)

I used Claude Code, an AI coding assistant made by Anthropic, to build Highwater. It wrote most of the code, the tests, and first drafts of the documents, working from a project brief I wrote and the changes I asked for. It also used add-on design skills: Impeccable, UI UX Pro Max, Expo's official skills, and Emil Kowalski's animation skill. I chose the problem, decided the features and the design direction, set up every account, checked the data, tested the app on my phone, told it what to change, and wrote this submission. The app itself uses no AI: every status comes from written rules.

(About 90 words.)

## Full version

### What the AI did

- **Wrote most of the code:** the website, the phone app, the shared rules engine, the Cloudflare Worker, the database setup (SQL), and the scripts that prepare Census, FEMA, and map data.
- **Wrote the 171 automated tests** and ran checks in a browser: different screen sizes, keyboard use, contrast, and what happens when each data source fails.
- **Tested each data source** with real requests before building on it, and recorded the results in `DATA_SOURCES.md`.
- **Drafted the safety guidance text** from official sources (NWS, Ready.gov, the Red Cross, SC Emergency Management Division), with a link to each source.
- **Drafted the documents:** README, METHODOLOGY, NOTES, LEARNING, FINAL_SUMMARY, the demo script, and the first drafts of these submission answers.

### Design skills it used

These are add-ons for Claude Code that guide how it designs. They are instructions and checklists, not separate AI services:
- **Impeccable** (open source, by Paul Bakaus): design critiques and checklists for layout, type, and polish.
- **UI UX Pro Max** (open source): a searchable database of styles, color palettes, and font pairings. It generated three design options, and I picked "Night Tide."
- **Expo's official skills:** guidance for building native-feeling screens, animations, and a consistent design system in React Native.
- **Emil Kowalski's design-engineering skill:** rules for animation timing and easing.

### What I did

- **Chose the problem.** I picked hazard readiness for my district after seeing how scattered storm information is. [ADD YOURS: your own reason, for example Hurricane Helene in 2024]
- **Wrote the project brief** (`CLAUDE.md`): who the app is for, which data to use, the four status levels, the safety rules (never call anything "safe," always point to 911 and officials), the design direction, and the schedule.
- **Made the decisions:** the features and their order, the name Highwater, the "Living Status" design idea, which of the three design options to use, and what to cut. For example, after testing the phone app's route planner I decided it wasn't useful enough and had it switched off there.
- **Set up every account and service myself:** GitHub, the Census API key, Cloudflare (Worker and "I'm human" check), OpenRouteService, Supabase, and Expo. I approved each login and kept the secret keys out of the code.
- **Tested the app on my own phone** through Expo Go and on the live website, and reported what looked wrong or felt slow (for example the screens that "stayed the same," the animations that only played once, and the Expo Go timeouts).
- **Checked the data:** [ADD YOURS / CHECK: for example comparing a gauge reading in the app with the USGS website, or the alert list with weather.gov]
- **Directed changes** at each checkpoint and chose what to keep or roll back.
- **Wrote the final submission** and recorded the demo video myself, using these drafts as a starting point.

### How I made sure I understand my app

The contest rules say AI can't do the entire technical development and that I must understand my app. So:
- `LEARNING.md` logs what I did in each session and explains the main ideas (APIs, JSON, GeoJSON, CORS, Row Level Security, the UI thread, and more).
- `FINAL_SUMMARY.md` walks through every part of the app and has practice questions with answers. [CHECK: update this line once you've studied it]
- `NOTES.md` records every real problem and how it was solved.

### The app doesn't use AI

Nothing in Highwater calls an AI model. Every status, score, piece of advice, and route ranking comes from fixed rules written out in `METHODOLOGY.md` and shown on the "How it works" page.

All open-source libraries and services are listed in the [README](README.md#libraries-and-services).
