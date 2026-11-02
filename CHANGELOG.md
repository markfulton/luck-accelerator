# Changelog

## 1.2.0, unreleased

A reason to open it every day.

- A rotating quote on luck, agency and showing up on the overview: 41 lines, each with its author and source, disputed ones marked "Attributed to". A new one on every visit and every 45 seconds, or with the arrow. Add your own in `custom.js`.
- A Luck Dashboard shortcut on the desktop (`scripts/shortcut.mjs`), on Windows, macOS and Linux. It opens the dashboard, and reuses it when it is already running.
- The local server answers `/api/whoami` so the shortcut can find a dashboard that is already open.

## 1.1.0, unreleased

Make every find easy to act on.

- Add to Google Calendar and an .ics file for Apple Calendar and Outlook on every event, with the starter and the one line intro in the description and a reminder an hour before.
- The whole week as one calendar file, each day's moves as a block at a time the person picks.
- Follow up reminders, a "follow ups waiting on you" list on the overview, and a written `nudge` draft for every first message.
- Copy the message and open the contact page in one click, open a draft in the email app when a public business address exists, and directions for in person events.
- A printable prep card for any find, and a spreadsheet export of every find with its status and notes.
- Profile gains `timezone` and `intro`; finds gain `contact.email` and `event.address`.
- The skill offers to add events to the person's own calendar when the agent app has a calendar connector, on a yes only.
- Dashboard 1.1.2: once a find has replied, the Pipeline view shows one card about Hot Leads in the Agent Ops Club, which can be hidden for good, and the footer carries an invitation to a free club account. Neither one sends anything.

## 1.0.0, unreleased

First version.

- Five question interview, saved to `profile.json` and reused on later runs.
- Research across local connections, events in the next 30 days, online communities, sub niches and groups to join, using public pages only.
- Fit score out of 10 (audience, reach, momentum) with a source link for every find.
- Outreach drafts for the top picks and every find the plan asks you to message, written to a conversation first standard.
- One data file per run (`runs/<date>/data.json`), checked and rendered by `scripts/build.mjs` into a report and the dashboard.
- The luck dashboard: luck map, top moves, a seven day plan with checkboxes, filterable opportunities, copyable drafts, a pipeline, insights, luck earned and a weekly streak. Personalized per person through layout, labels, panels and an optional header image. Runs on the user's computer only, with a small local server that saves progress to `progress.json`.
- A scheduled refresh (`routines/refresh.md`) that reads progress, carries forward saved finds, adds new ones and commits each run to the folder's local history.
- `scripts/check-links.mjs`, `scripts/copy-check.mjs`, `scripts/build.mjs` and `dashboard/serve.mjs`, each with a self test.
- Two example runs with dashboards: a web designer in Austin and a strength coach in Manchester.
