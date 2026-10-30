# Run data: `runs/<YYYY-MM-DD>/data.json`

Every run writes one `data.json`. It is the single source for the run. `scripts/build.mjs` checks it, renders `report.md` from it, and feeds the dashboard. Never write `report.md` or `dashboard/data.js` by hand.

Plain JSON, UTF-8. No em dashes or en dashes in any text. Dates are wall clock values in the person's own time zone, with no zone written: convert an online event to their zone before writing it. `YYYY-MM-DD`, or `YYYY-MM-DDTHH:MM` when a start time is shown.

## Top level

| Key | Required | What it holds |
|---|---|---|
| `schema` | yes | Always `1` |
| `run` | yes | `{ "date": "2026-10-28", "mode": "first" or "refresh", "note": "optional line shown under the report title" }` |
| `profile` | yes | The interview answers, see below |
| `summary` | no | Two or three sentences: what this week looks like for this person |
| `top_moves` | yes | Exactly three `{ "text", "find" }`. `find` is a find's `id` or its exact `name` |
| `insights` | yes | Two to four `{ "title", "body", "finds": [ids or names] }`. Patterns you noticed, specific to this person. See "Insights" |
| `finds` | yes | Every confirmed find, see below |
| `subniches` | yes | Three to five `{ "name", "pitch", "evidence": [{ "title", "url" }] }` |
| `creative_moves` | yes | Three `{ "title", "body", "minutes", "finds": [ids or names] }` |
| `plan` | yes | One to seven days `{ "date", "minutes", "actions": [{ "text", "find" }] }`. `find` is optional per action |
| `checks` | yes | `{ "links": "...", "copy": "...", "facts": "..." }`, one honest sentence each |
| `layout` | no | Personalize the overview, see "Personalizing the dashboard" |
| `labels` | no | Rename the four sections for this person. Keys: `connections`, `events`, `communities`, `groups` |
| `panels` | no | Extra overview panels, see below |
| `theme` | no | `{ "hero": "assets/personal/hero.webp", "kicker": "short line above the greeting" }` |

## `profile`

The same object is saved on its own as `profile.json` in the folder, so later runs and the scheduled refresh can read it without asking again.

```json
{
  "city": "Austin",
  "country": "United States",
  "online_only": false,
  "niche": "Freelance web designer",
  "offer": "Small business website build",
  "price": "about $3,500, plus a $150 a month care plan",
  "want": "Local service businesses, and the agencies and photographers who already serve them",
  "hours_per_week": 3,
  "timezone": "America/Chicago",
  "intro": "I build websites for local service businesses in Austin.",
  "limits": ["No Facebook groups"],
  "already_in": [],
  "assumptions": "One line, or omit",
  "allow_own_browser": false
}
```

`timezone` is the IANA zone of where they are based (read it from the computer, or from their city); the dashboard adds it to Google Calendar links. `intro` is the one line they say when they meet someone, written to the rules in `reference/outreach.md`; it appears on event calendar entries and prep cards. `allow_own_browser` records whether they said yes to research in their own browser, so the scheduled refresh can follow it. `country` sets the date format (US style for the United States and Canada, day first elsewhere).

## A find

```json
{
  "id": "optional, build.mjs makes one",
  "type": "person | business | event | community | group",
  "name": "Public name of the business, event or community",
  "org": "optional: the business a person belongs to",
  "role": "optional: the person's public role",
  "why": "One sentence, plain words: why this fits this person",
  "score": { "audience": 0-4, "reach": 0-3, "momentum": 0-3 },
  "source": { "url": "https://...", "title": "Page title", "seen": "What you saw on that page, with the date you saw it if relevant" },
  "contact": { "via": "Contact form on their site", "url": "https://... optional", "email": "optional: a public business address shown on their own site, never a personal one" },
  "event": { "start": "2026-11-05T18:00", "end": "optional", "venue": "Name, area, or Online", "price": "Free", "format": "In person", "address": "optional: street address for directions", "recurring": "optional: Every Friday" },
  "community": { "platform": "Skool | Reddit | Discord | Slack | Forum | Newsletter | Meetup | Club", "members": "as shown on the page", "last_activity": "Post on 26 Oct", "rules": "What the rules say about introductions and promotion", "cost": "Free | Paid", "cadence": "Meets weekly" },
  "recommend_join": true,
  "tags": ["optional", "short", "labels"],
  "drafts": {
    "first_message": "For people and businesses",
    "if_reply": "One line for step two",
    "nudge": "One short message if there is no reply after a few days",
    "starter": "Conversation starter at an event",
    "follow_up": "Next day message after an event",
    "intro_post": "Community introduction post",
    "helpful_answer": "When a community bans promotion: a helpful reply to an existing question",
    "first_comment": "One idea for a helpful first comment"
  }
}
```

- `type` `person` and `business` show under connections. `event` under events. `community` is online. `group` is a local club, chamber or recurring meetup group to join and keep attending.
- `recommend_join: true` also lists a community under "Groups and communities to join".
- `event` is required for events. `start` must be today or later. For a recurring event whose page shows a pattern but no single date, set `start` to the next date that pattern gives, set `recurring` to the pattern, and say in `source.seen` that the date was worked out from the pattern.
- Write a `nudge` for every person or business with a `first_message`. The dashboard puts it in the follow up reminder.
- Only include `drafts` keys that apply. Write drafts for every top pick and for every find the plan asks the person to message.
- Keep `id` stable across runs. If you carry a find forward from an earlier run, reuse the `id` from that run's `data.json`.

## Insights

Insights are the part a person cannot get from a list. Look across the finds for patterns that save time or open a door, and name the finds involved. Good insights:

- "Four of your top finds are in East Austin. One Saturday morning at Fleet Coffee covers two of them."
- "Nobody in r/Manchester is answering the strength questions from people over 40. That gap is yours."
- "The chamber's breakfast and the coworking social are the same crowd. Go to one, follow up at the other."

Never generic advice. Every insight points at named finds.

## Personalizing the dashboard

The dashboard is a template with a stable core, and you shape it for each person:

- `layout.overview` orders and picks the overview modules: `stats`, `map`, `moves`, `insights`, `panels`, `week`, `scoreboard`. Lead with what matters most to this person. Someone with an event-heavy week leads with `week`; someone online only might drop nothing but lead with `insights`.
- `labels` renames the four sections in this person's words, for example `{ "connections": "Studios and partners", "communities": "Online rooms" }`.
- `theme.kicker` is a short line above the greeting, such as "Your Austin week" or "Week 3 of your lucky streak".
- `panels` adds small panels to the overview, built from four safe types:
  - `{ "type": "callout", "title", "body" }`
  - `{ "type": "stat", "title", "value", "caption" }`
  - `{ "type": "list", "title", "items": [{ "text", "url" }] }` (url optional)
  - `{ "type": "bars", "title", "items": [{ "label", "value" }] }`
  Use them for something specific to this person's goal: "Coworking spaces within 2 miles", "Events by neighbourhood", "Your three best sub niches by evidence".
- `theme.hero` points at a personal header image in `dashboard/assets/personal/`, only if your app can generate images. Match the house style: warm cream paper, fresh four leaf clovers and brushed gold, everything on the right third, the left two thirds empty, soft light, no text, about 21:9. Add one quiet local or niche cue. Without it, the default header is used.
- For anything the safe types cannot do, write `dashboard/custom.css` and `dashboard/custom.js`. They load after the core and survive template upgrades. Never edit `index.html`, `styles.css` or `app.js` in the user's folder.

## A minimal example

```json
{
  "schema": 1,
  "run": { "date": "2026-10-28", "mode": "first" },
  "profile": { "city": "Leeds", "country": "United Kingdom", "niche": "Bookkeeper for trades", "hours_per_week": 2 },
  "summary": "A quiet week with one strong breakfast and two warm partner intros.",
  "top_moves": [{ "text": "Book the free chamber breakfast", "find": "Leeds Chamber Breakfast" }],
  "insights": [{ "title": "Your partners are on one street", "body": "...", "finds": ["Example Trade Supplies"] }],
  "finds": [],
  "subniches": [],
  "creative_moves": [],
  "plan": [{ "date": "2026-11-02", "minutes": 20, "actions": [{ "text": "Register for the breakfast", "find": "Leeds Chamber Breakfast" }] }],
  "checks": { "links": "12 checked, 12 ok", "copy": "PASS", "facts": "Taken from the linked pages on 2026-10-28" }
}
```
