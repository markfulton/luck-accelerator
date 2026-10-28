# Refresh routine

This is the scheduled run. It finds new openings for someone who already ran the Luck Accelerator, rebuilds their dashboard, and saves the run in their folder's history. Nobody is watching, so it asks no questions.

You were started with two paths: the **skill folder** (where this file lives) and the **data folder** (the person's `luck-accelerator` folder). If either is missing or does not exist, stop and write that in your final message.

Read `SKILL.md` in the skill folder first. Its hard limits apply in full, and so do `reference/sources.md`, `reference/outreach.md` and `templates/data-schema.md`. Then follow these steps.

## 1. Read where things stand

1. `profile.json` in the data folder: the person's answers. Do not ask for anything.
2. `progress.json`, if it exists: what they did since the last run. Statuses are `saved`, `moved` (messaged, registered or joined), `replied`, `met`, and `passed` (not for me).
3. The newest `runs/<date>/data.json`: last run's finds.
4. `schedule.md`: the log of earlier scheduled runs.

If today already has a `runs/<today>/` folder, stop. The run already happened.

## 2. Decide what carries forward

- **Never repeat** a find whose status is `moved`, `replied`, `met` or `passed`. The dashboard keeps the active ones in the pipeline by itself.
- **Carry forward** finds that are `saved`, and top picks from last run that are still `open`, but only after you open their page again and confirm they are still current. Events must still be in the future. Reuse the exact `id` from the earlier `data.json`. Rewrite the `why` if something changed.
- Everything else from last run drops off.

## 3. Find new openings

Research as in section 4 of `SKILL.md`, with smaller targets, because the point is what is new. Use your built-in browser when a page needs one. Use the person's own browser only if `profile.json` has `allow_own_browser: true`; nobody is there to ask.

| Find | New finds to aim for |
|---|---|
| Connections | 4 to 6 |
| Events in the coming 30 days | 4 to 8 |
| Communities and groups | 3 to 5 |
| Sub niches | keep last run's that still hold, add one if you find one |

Search angles last run did not use: a different neighbourhood, a different kind of partner, a different platform. A quiet week with three real finds is a good run.

## 4. Write the run

Write `runs/<today>/data.json` following `templates/data-schema.md`, with `run.mode` set to `"refresh"`.

- `summary` speaks to their progress in one plain sentence first, then the week ahead. "You messaged two partners and went to one run last week. This week has a new coworking social and two fresh partner leads."
- At least one insight looks back: what worked, what is waiting on a reply, what to follow up.
- `top_moves` include a follow up for anything in `moved` with no reply after a week, when there is one.
- `theme.kicker` can mention their streak when progress shows moves in consecutive weeks: "Week 3 of your lucky streak".
- The plan starts today and runs seven days.
- Keep last run's `layout`, `labels`, `panels` and `theme` unless the new finds call for a change.

## 5. Build and check

Run, from the skill folder:

```
node scripts/build.mjs "<data folder>"
node scripts/check-links.mjs "<data folder>/runs/<today>/report.md"
node scripts/copy-check.mjs "<data folder>/runs/<today>/report.md"
```

Fix every problem, confirm every `blocked` link by opening it in a browser or a page read tool, remove every `dead` or `moved` one, and rebuild until all three pass. Fill in `checks` honestly. Do not start the dashboard server. The person opens it when they are ready.

## 6. Save the run in the folder's history

If the data folder is a git repository, commit everything with the message `Run <today>: <N> finds, <M> new`. Never add a remote, never push, never change git settings. If git is not available, skip this step.

## 7. Log and report

Append one line to `schedule.md`: the date, finds, new finds, and the check results. Then finish with a short message for the person:

- how many new openings, and the single best one by name;
- anything that needs a follow up;
- "Open it by asking your agent: open my luck dashboard."

## If something blocks the run

If web search is unavailable, the network is down, or a check cannot pass, do not write a half finished run. Append the reason to `schedule.md`, leave every file as it was, and say what happened in your final message.
