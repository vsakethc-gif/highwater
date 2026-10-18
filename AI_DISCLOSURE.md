# AI disclosure

_Draft written with Claude from our project records. Before submitting, read it carefully and change anything that doesn't match your memory. It must stay accurate._

## Summary

I used **Claude** (an AI coding assistant made by Anthropic, running in the Claude Code desktop app) to build Highwater. **Claude wrote nearly all of the code**, the data scripts, the tests, and first drafts of the documentation. It worked from a detailed project brief that I wrote, and it explained its choices as it went. I directed the project, made the product and design decisions, set up and connected every account and service, tested the app myself, and reported the problems I found.

**The app itself does not use AI.** Nothing in Highwater calls an AI model. Every status, score, piece of advice, and route ranking comes from fixed rules written out in [METHODOLOGY.md](METHODOLOGY.md) and shown on the app's "How it works" page.

## What I did

- **Chose the problem and wrote the brief.** I picked hazard readiness for SC-5 and wrote `CLAUDE.md`, the project brief: who it's for, which data to use, the four status levels, the safety rules (never call anything "safe," always point to 911 and officials), the design direction, the scope tiers, and the schedule.
- **Made the decisions.** The scope and the order of features, the build schedule, the rule to stop at each phase and show me, and the name **Highwater**.
- **Set up every account and service myself:** GitHub (repository and website hosting), a U.S. Census API key, Cloudflare (the Worker and the "I'm human" check), OpenRouteService, and Supabase (the reports database). I approved each login, handled the secret keys so they never went into the code, and ran the database setup.
- **Tested the app on the live site.** For example, I sent the first real community reports, found that the "Verify you are human" check was failing (red "Troubleshoot" message), and kept testing in different browsers until it was fixed.
- **Reviewed each phase** at its checkpoint before work moved on.
- **Will write the submission in my own words**, using the drafts in `SUBMISSION.md` as a starting point, and record the demo video myself.

_Add anything else you did yourself (for example, comparing a gauge reading on the app with the USGS website, or checking the app on your own phone)._

## What Claude did

- Wrote the TypeScript code for the app, the Cloudflare Worker, the database setup (SQL), and the data-building scripts.
- Tested each data source with real requests and recorded the results in `DATA_SOURCES.md`.
- Wrote the 159 automated tests and ran browser, keyboard, accessibility, and performance checks.
- Drafted the safety guidance text from official sources (NWS, Ready.gov, the Red Cross, SC Emergency Management), with a link to each source.
- Drafted `README.md`, `METHODOLOGY.md`, `NOTES.md`, `LEARNING.md`, this file, `SUBMISSION.md`, and `FINAL_SUMMARY.md`.

## How I made sure I understand the app

The contest rules say AI can't make up the entire technical development and that I must understand my app. So:

- `LEARNING.md` logs what I did in each session and explains each main idea (APIs, JSON, GeoJSON, CORS, Row Level Security, polygons, hashing, and more).
- `FINAL_SUMMARY.md` walks through the whole app, how every part works, and likely judge questions. I study it and practice with quiz questions on every part. _(Update this line once you've done it.)_
- `NOTES.md` records each real problem we hit and how it was solved. I can explain these in my own words.

## Other tools

All open-source libraries and outside services are listed with what they do in the [README](README.md#libraries-and-services).
