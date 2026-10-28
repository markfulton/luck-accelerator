<h1 align="center">Luck Accelerator</h1>

<h3 align="center">Luck favors movement.</h3>
<p align="center">A free Claude skill that finds the people, events and communities worth meeting this week, writes the first message for each one, and keeps it all in your own luck dashboard. Every week it finds new openings. You do the moving.</p>

<p align="center">
  <img alt="MIT license" src="https://img.shields.io/badge/License-MIT-3FB950?style=flat-square">
  <img alt="Claude skill" src="https://img.shields.io/badge/Claude-skill-D97757?style=flat-square&logo=anthropic&logoColor=white">
  <img alt="Works in desktop agent apps" src="https://img.shields.io/badge/Claude_Codex_Antigravity_Cursor-ready-2B2B2B?style=flat-square">
</p>

<p align="center">
  <a href="https://www.skool.com/vibe-coding-is-life/about?ref=456537abaf37491cbcc6976f3c26af41"><strong>Get more free tools like this in Vibe Coding is Life on Skool</strong></a>
</p>

<p align="center">
  <img src="assets/dashboard-austin.webp" width="900" alt="The luck dashboard for a web designer in Austin: a greeting with 28 openings, a short summary of the week, and the top three moves">
</p>

## What it does

Most new customers and partners come from a conversation someone started. This skill makes it easy to start more of them. Tell it where you are, what you sell and who you want to meet, and it:

- **Finds high value local connections.** Business owners who just opened, referral partners who serve the same customers you do, and the connectors whose job is meeting people.
- **Finds local events that match your interests.** Meetups, chamber breakfasts, coworking nights, workshops and conferences in the next 30 days, with dates and prices checked on the event page.
- **Finds online networks.** Skool communities, subreddits, Discord and Slack groups, forums and newsletters where your customers already spend time.
- **Spots sub niches.** Narrower slices of your market where your offer stands out, with the evidence for each.
- **Writes the outreach.** A short, friendly first message for every top pick, a conversation starter for every event, and an introduction post for every community. Conversation first, never a cold pitch.
- **Proposes groups to join.** The local groups and Skool communities worth showing up in every week.
- **Plans your week.** A seven day movement plan that fits the hours you have.

Every find is scored out of 10 for fit and links to the page it came from. Before you see anything, the skill checks every link and every draft.

## Your luck dashboard

Everything lands in a dashboard that lives on your computer, shaped around your city, your niche and your goals.

- **Your luck map.** Every find on one chart. The closer to the centre, the better the fit. New finds glow.
- **Top three moves** for the week, and a day by day plan with real event dates and a checkbox for every action.
- **Opportunities** you can filter, search and sort, each with why it fits, where it came from and how to reach them.
- **Drafts ready to copy.** One click copies a message. You make it yours and send it yourself.
- **A pipeline** from saved, to messaged, to replied, to met.
- **Luck you earn.** A move is worth 1, a reply 3, a meeting 5, and a weekly streak keeps you going.
- **Insights** that spot patterns across your finds, like two partners on the same street or one event that covers three of your top picks.

<p align="center">
  <img src="assets/dashboard-opportunities.webp" width="900" alt="Opportunities for a strength coach in Manchester: cards with a gold fit score, the reason each one fits, and filters by people, events and communities">
</p>

<p align="center">
  <img src="assets/dashboard-week.webp" width="900" alt="A seven day movement plan with minutes for each day, event times and a checkbox for every action">
</p>

## It keeps finding new openings

After your first run, the skill offers to refresh itself on a schedule: every Monday morning, or whatever suits you. Each refresh reads what you did, skips anything you already acted on, keeps what you saved, finds new people, events and communities, and updates your dashboard. In the Claude desktop app it uses the app's own scheduled tasks. Your folder keeps its own history, so you can look back and see how your luck grew.

## See it first

Two full example runs, one in the US and one in the UK. Download the repo and open either `dashboard/index.html` to explore them.

- [A web designer in Austin, Texas](examples/austin-web-designer/runs/2026-10-28/report.md)
- [A strength coach in Manchester, UK](examples/manchester-fitness-coach/runs/2026-10-28/report.md)

## Install it in two steps

1. **Download this repo.** Click the green **Code** button above, choose **Download ZIP**, and extract it to a folder on your computer.
2. **Tell your agent to install it.** Open the Claude desktop app, go to the **Code** tab, pick any folder, and say:

   > Install the Luck Accelerator skill from this folder: (paste the folder path)

It works the same way in the Codex app, Antigravity and Cursor. Your agent does the setup.

## Use it

Say **"run the luck accelerator"** to your agent. It asks five short questions:

1. Where are you based?
2. What do you do?
3. What do you sell, and roughly what does it cost?
4. Who do you want more of?
5. How much time can you give this each week?

It researches, ranks, writes, checks, and opens your dashboard. Then:

- **"Open my luck dashboard"** opens it again any time, with your progress saved.
- **"Run the luck accelerator again"** finds new openings now.
- **"Schedule the luck accelerator"** sets or changes the weekly refresh.

## What it never does

- It never sends a message, posts, comments, joins a group, RSVPs, follows or connects for you. You do every action yourself, by hand. A first message lands because a real person sent it.
- It never automates LinkedIn, Facebook, Reddit, Discord, Skool, Meetup or any other platform.
- It never logs in to anything and never reads pages behind a login.
- It only lists people in their public business role, linked to their business or event page. No personal profiles, no home addresses, no personal phone numbers.
- It never invents a find. If it could not confirm something on a real page during the run, it is not in your dashboard.
- It never sets a schedule without asking you first.

## Your data stays on your computer

Your answers, your runs, your progress and your dashboard are plain files in a `luck-accelerator` folder of your own. The dashboard runs on your computer only and loads nothing from the internet. Its history is kept by your computer and never uploaded. The only thing that leaves your computer is the web searches your agent app runs, and the skill keeps those to your city, your niche and public names. More in [PRIVACY.md](PRIVACY.md).

## What is inside

| File | What it does |
|---|---|
| `SKILL.md` | The instructions your agent follows |
| `routines/refresh.md` | The scheduled refresh |
| `reference/sources.md` | Where to look for each kind of find, by country |
| `reference/outreach.md` | How every draft is written, with a worked example |
| `templates/data-schema.md` | The one file each run writes, and how the dashboard is personalized |
| `dashboard/` | The luck dashboard template, its artwork and its small local server |
| `scripts/build.mjs` | Checks a run, writes the report and updates your dashboard |
| `scripts/check-links.mjs` | Checks every link before you see it |
| `scripts/copy-check.mjs` | Checks every draft against the outreach rules |
| `examples/` | Two complete example runs with their dashboards |

## Where this comes from

Created by Mark Fulton of Reinventing.AI, an AI agent and app developer and the founder of [Vibe Coding is Life](https://www.skool.com/vibe-coding-is-life/about?ref=456537abaf37491cbcc6976f3c26af41), a community of 340,000+ people building with AI.

**Want more free tools like this one?** Join [Vibe Coding is Life on Skool](https://www.skool.com/vibe-coding-is-life/about?ref=456537abaf37491cbcc6976f3c26af41). It is free, and new skills, lessons and live sessions land there first.

**Ready to have AI agents installed and working in your business?** That is what the [Agent Ops Club](https://club.reinventing.ai/?utm_source=github&utm_medium=readme&utm_campaign=luck-accelerator&utm_content=next-step) is for.

## License

MIT. Use it, change it, share it. See [LICENSE](LICENSE).
