# Privacy

The Luck Accelerator is a set of instructions and two small scripts. It has no server, no account and no tracking.

## What stays on your machine

- Your interview answers, saved in `luck-accelerator/profile.md` in your working folder.
- Every report, saved in `luck-accelerator/runs/<date>/report.md`.
- Your tracker, `luck-accelerator/tracker.md`, which only you write to.

The skill never uploads, pastes or sends these files anywhere.

## What leaves your machine

- **Web searches.** Your agent app sends search queries to its search provider. The skill keeps queries to your city, your niche and public names, and never puts your own name, email or offer details into a query.
- **Page reads.** Your agent app opens public web pages to confirm each find, and `scripts/check-links.mjs` requests each link in your report to check that it still works. Those sites see an ordinary visit from your computer.

Your agent app itself (Claude, Codex, Antigravity, Cursor) handles your conversation under its own privacy terms.

## About the people in your report

The skill lists people only in their public business role, from pages they published as a business or a community: a company site, an event they organize, a podcast they host. It does not collect home addresses, personal phone numbers, family details or anything from personal social profiles, and it does not build profiles of private individuals.
