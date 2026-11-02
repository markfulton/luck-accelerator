# Privacy

The Luck Accelerator is a set of instructions, a dashboard template and a few small scripts. It has no server on the internet, no account and no tracking.

## What stays on your computer

Everything lives in a `luck-accelerator` folder inside the folder you work in:

- `profile.json`: your interview answers.
- `runs/<date>/`: each run's data and report.
- `progress.json`: what you marked in the dashboard, and your notes.
- `dashboard/`: your dashboard.
- `schedule.md`: your refresh schedule, if you set one.

The skill never uploads, pastes or sends these files anywhere. If your computer has git, the folder keeps its own history on your computer. The skill never connects that history to any online service and never pushes it.

## The dashboard

- It loads nothing from the internet: no fonts, no scripts, no analytics. Its images ship with it.
- When your agent opens it, a small server runs on your computer only (address `127.0.0.1`). Nothing outside your computer can reach it. It serves the dashboard and saves your progress to `progress.json`, and nothing else.
- Opened straight from the file, it saves progress in your browser instead.
- Your agent adds one shortcut to your desktop that opens the dashboard. It is the only file written outside your `luck-accelerator` folder, and you can delete it any time.

## What leaves your computer

- **Web searches.** Your agent app sends search queries to its search provider. The skill keeps queries to your city, your niche and public names, and never puts your own name, email or offer details into a query.
- **Page reads.** Your agent app opens public web pages to confirm each find, and `scripts/check-links.mjs` requests each link to check it still works. Those sites see an ordinary visit from your computer.
- **Links you click.** Opening a source or contact link from the dashboard visits that site, like any link.

Your agent app itself (Claude, Codex, Antigravity, Cursor) handles your conversation and any scheduled task under its own privacy terms.

## About the people in your dashboard

The skill lists people only in their public business role, from pages they published as a business or a community: a company site, an event they organize, a podcast they host. It does not collect home addresses, personal phone numbers, family details or anything from personal social profiles, and it does not build profiles of private individuals.
