# How it works

SC-5 Ready turns official public data into a status for your location, using fixed rules written out on this page. It is **transparent, rule-based analysis**: there is no artificial intelligence in the app, and no secret formula. Every status lists the reasons behind it under "Why this status?"

> **This app is not an official warning system.** It can be late, wrong, or missing alerts. Official National Weather Service alerts, local officials, and 911 come first.

## The four status levels

| Level | Name | What it means |
|---|---|---|
| 0 | Normal | No active official alerts for this hazard here right now |
| 1 | Watch | Conditions could develop. Get ready. |
| 2 | Warning | It is happening or about to. Act now. |
| 3 | Danger | Life-threatening, extreme, or emergency-level alert |

Each level always has its own icon, word, and color, so it never depends on color alone.

**Overall status** = the highest level among all hazards at your place. The top hazard is shown first, and any others are listed below it.

**"Can't confirm."** If official alerts, river gauges, or the rain forecast fail to load, or gauge readings are more than 2 hours old, the app will not show "Normal." It says it can't confirm conditions and points you to official sources. If something *does* raise the level, that level is shown along with a note that some data is missing.

## Where the data comes from

| Data | Source | How often it updates |
|---|---|---|
| Official alerts (all hazard types) | National Weather Service, api.weather.gov | Checked every 10 minutes while the app is open |
| River and stream levels | U.S. Geological Survey Water Data API (provisional) | About every 15 minutes |
| Official flood stages | NOAA National Water Prediction Service | Built into the app's gauge list |
| Rain forecast | National Weather Service forecast grid | Checked every 10 minutes |
| Flood zones | FEMA National Flood Hazard Layer | Checked live for a point; tract shares built in |
| Population data | U.S. Census Bureau, American Community Survey 2020–2024 | Built into the app |
| Boundaries and ZIP centers | U.S. Census Bureau 2024 boundary and gazetteer files | Built into the app |

Full technical details, test results, and limits for each source are in `DATA_SOURCES.md` in the source code.

## Rule 1: Official alerts

Each National Weather Service alert is matched to a hazard and a level using this table.

| Hazard | Watch (1) | Warning (2) | Danger (3) |
|---|---|---|---|
| Flooding | Flood Watch, Flash Flood Watch, Flood Advisory, Hydrologic Outlook, Flood Statement | Flood Warning, Flash Flood Warning | Flash Flood Warning with a "considerable" or "catastrophic" damage threat, or "Flash Flood Emergency" wording |
| Tornado | Tornado Watch | Tornado Warning | Tornado Warning with a "considerable" or "catastrophic" damage threat, or "Tornado Emergency" / "particularly dangerous situation" wording |
| Severe storm | Severe Thunderstorm Watch, Severe Weather Statement, storm-related Special Weather Statement | Severe Thunderstorm Warning | Severe Thunderstorm Warning with a "destructive" damage threat |
| Tropical storm or hurricane | Tropical Storm Watch, Hurricane Watch, Storm Surge Watch, Tropical Cyclone Local Statement | Tropical Storm Warning, Hurricane Warning, Storm Surge Warning | Extreme Wind Warning; Hurricane Warning mentioning a major hurricane |
| Winter storm or ice | Winter Storm Watch, Winter Weather Advisory | Winter Storm Warning, Ice Storm Warning, Snow Squall Warning | Blizzard Warning |
| Extreme heat | Heat Advisory, Extreme Heat Watch | Extreme Heat Warning | — |
| Extreme cold | Cold Weather Advisory, Extreme Cold Watch, Freeze Watch, Freeze Warning | Extreme Cold Warning | — |
| High wind | Wind Advisory, Lake Wind Advisory, High Wind Watch | High Wind Warning | — |
| Fire weather | Fire Weather Watch | Red Flag Warning, Extreme Fire Danger | — |
| Fog or smoke | Dense Fog Advisory, Dense Smoke Advisory, Freezing Fog Advisory | — | — |
| Air quality | Air Quality Alert, Air Stagnation Advisory | — | — |
| Evacuation order | — | — | Evacuation Immediate |
| Other official alert | Any alert not listed above | Civil Emergency Message, Civil Danger Warning | Shelter In Place Warning |

Notes:

- NWS renamed some products in 2025 ("Excessive Heat" became "Extreme Heat"; "Wind Chill" products became "Extreme Cold" and "Cold Weather"). The old names are still recognized.
- **Information only:** the Hazardous Weather Outlook (issued almost every day) and the Frost Advisory (mainly about plants) are listed with the alerts but never raise the status.
- **Cancelled and expired alerts are ignored.** Every warning carries a code that says whether the message is new, continued, extended, cancelled, or expired. Cancelled or expired messages never raise a status.
- **Which alerts apply to you.** For a whole county: any alert that lists the county. For a single spot (your location or a ZIP code): the alert must list the county, and if NWS drew a warning area, the spot must be inside it.

## Rule 2: River gauges (flooding)

| Gauge reading | Flood level |
|---|---|
| At or above **action stage** | Watch |
| At or above **minor flood stage** | Warning |
| At or above **moderate or major flood stage** | Danger |

- Flood stages are official values from NOAA for each gauge. Example: Catawba River near Rock Hill: action 13 ft, minor 15 ft, moderate 25 ft, major 30 ft.
- Only gauges in the same county count.
- **Gauges with no official flood stage never raise the level.** They're shown for context only, labeled "No official flood stage." We never invent thresholds.
- Readings more than **2 hours old** are treated as possibly offline. They never raise or clear a status, and the status is marked as possibly incomplete.
- **Trend:** the newest reading compared with the oldest one in the last 3 hours. A change of 0.1 ft or more is "Rising" or "Falling"; less is "Steady."

## Rule 3: Rain forecast (flooding)

- **2 inches or more of rain forecast in the next 24 hours raises flooding to Watch.**
- Why 2 inches: South Carolina averages about 48 inches of rain a year, or about 4 inches a month. Two inches in one day is half a month's rain falling at once, which is enough to make creeks rise and low roads flood. This is a cautious "get ready" signal chosen for this app, not an official NWS threshold and not a prediction. It never raises the level above Watch on its own; NWS issues its own Flood Watches and Warnings using local flash-flood guidance.
- The forecast comes from the National Weather Service grid square covering your spot, or the county seat for a whole county. NWS gives rain in millimeters for time blocks of 1 to 6 hours; we add up the part of each block inside the next 24 (or 48) hours and convert to inches.

## Vulnerability, flood exposure, and priority (district map)

These scores answer: "If a hazard hits, where are the people with the fewest resources most exposed?" They are for understanding the district, **not** for deciding anyone's status.

All scores are **relative to the 149 census tracts in SC-5's 8 counties**. A score of 80 means "higher than about 80% of SC-5 tracts," not "80% of people."

**Vulnerability score (0–100):** for each tract, take the percentile rank of each of these four measures among SC-5 tracts, then average the four ranks:

1. Share of people age 65 and older (Census table B01001)
2. Share of households with no vehicle (B25044)
3. Share of people below the poverty line (B17001)
4. Share of people with a disability (B18101)

A percentile rank is the share of tracts with a lower value, counting ties as half.

**Flood exposure score (0–100):** the percentile rank of the share of the tract's land inside FEMA's Special Flood Hazard Area (the high-risk "1% annual chance" zone, zones A and V). The share is measured by overlaying FEMA's flood-zone shapes on each tract. The real percentage is always shown next to the score.

**Priority score (0–100):** the average of the vulnerability and flood exposure scores. The tract panel always shows the separate parts and the current county status, never the combined number alone.

**Insufficient data:** a tract with fewer than 200 people or fewer than 50 households (for example, a college dorm or a prison) gets no vulnerability or priority score. Its percentages would be misleading. Three SC-5 tracts are in this group.

**Map colors** use five equal bands (0–19, 20–39, 40–59, 60–79, 80–100) on a light-to-dark scale chosen to be readable with color-vision differences.

## Guidance ("What to do")

Guidance is fixed text chosen by hazard and level, written at about an 8th grade reading level. It is based on:

- **Flooding:** [NWS: Turn Around Don't Drown](https://www.weather.gov/safety/flood-turn-around-dont-drown), [Ready.gov: Floods](https://www.ready.gov/floods), [SC Emergency Management: Floods](https://www.scemd.org/prepare/types-of-disasters/floods/), [Red Cross: Flood safety](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/flood.html)
- **Tornado:** [NWS: During a tornado](https://www.weather.gov/safety/tornado-during), [Ready.gov: Tornadoes](https://www.ready.gov/tornadoes)
- **Severe storms:** [NWS: Thunderstorm safety](https://www.weather.gov/safety/thunderstorm), [Ready.gov: Severe weather](https://www.ready.gov/severe-weather)
- **Other hazards:** follow the official alert's own instructions ([NWS weather safety](https://www.weather.gov/safety/), [Ready.gov alerts](https://www.ready.gov/alerts)). Detailed guidance for these hazards is being added.

Context rules that change the advice:

- **Any flood Watch or higher** always includes "Turn around, don't drown," with NWS's figures: 6 inches of fast-moving water can knock over an adult, and 12 inches can carry away most cars.
- **In a FEMA high-risk flood zone** (when you use your location) with a flood Watch or higher: adds "be ready to leave, and know your way to higher ground."
- **Where 7% or more of households have no car** (about twice the SC-5 tract median of 3.5%): adds advice to ask a neighbor, family member, or county emergency management about a ride before roads flood.
- **Where the vulnerability score is 60 or higher, or many households have no car:** strengthens "Check on others."
- **Tornado and severe storm:** "stay where you are and take shelter" (lowest floor, interior room, away from windows). The app **never** suggests driving away, and never shows a route button for these hazards, even if a flood is also happening.

Every guidance block ends with: *This app is not an official warning system. Follow instructions from local officials. In an emergency, call 911.* The app never calls a place or route "safe."

## Scenario Mode

Scenario Mode replays a made-up emergency to show how the rules respond. Scenarios are small data files in the source code (fake alerts, gauge readings, and rain) run through the exact same rules as live data. While a scenario is on, every screen shows **"SIMULATION — not live data,"** the status card says "Simulated," and nothing is saved or sent anywhere.

## Limitations

- Not an official warning system; it can be late, wrong, or missing alerts.
- Live gauge data is provisional and some gauges go offline; many small creeks have no gauge at all. Chester, Lancaster, and Lee counties have no gauges with official flood stages, so only alerts and rain can raise their flood status.
- FEMA flood zones show long-term risk, not where it is flooding today, and some maps are years old. A flood-zone result is not an official determination for a property.
- Census figures are estimates with margins of error, especially for small tracts.
- A ZIP code is placed at its center point and assigned to the county that center falls in.
- The app cannot see road closures (South Carolina 511 has no public data feed).
