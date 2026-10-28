# Changelog

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
