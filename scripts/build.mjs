#!/usr/bin/env node
// Turns a run's data.json into the report and the dashboard, and keeps the user's folder current.
//   node build.mjs <luck-accelerator folder>        build from the newest runs/<date>/data.json
//   node build.mjs <folder> --run 2026-10-28        build from a named run
//   node build.mjs --selftest
// It validates the data (exits 1 with a list of problems), assigns stable ids, renders
// runs/<date>/report.md, copies or upgrades the dashboard template into <folder>/dashboard
// (custom.css, custom.js and assets/personal/ are never touched), and writes dashboard/data.js.
// No dependencies, Node 18 or newer.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE_DIR = path.join(SKILL_DIR, "dashboard");
const KEEP = new Set(["custom.css", "custom.js", "data.js"]);
const TYPES = { person: "connections", business: "connections", event: "events", community: "communities", group: "groups" };
const MODULES = ["stats", "map", "moves", "insights", "panels", "week", "scoreboard"];
const PANEL_TYPES = ["callout", "stat", "list", "bars"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

export function slug(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
const isUrl = (u) => typeof u === "string" && /^https?:\/\/[^\s]+$/.test(u);
const int = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

export function findId(f) {
  if (f.id) return f.id;
  let host = "";
  try { host = new URL(f.source && f.source.url).hostname.replace(/^www\./, ""); } catch { /* none */ }
  return (TYPES[f.type] || "find") + ":" + slug(f.name) + (host ? "@" + host : "");
}

export function validate(d) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };
  need(d && d.schema === 1, "schema must be 1");
  if (!d || typeof d !== "object") return errs;
  need(d.run && DATE.test(d.run.date), "run.date must be YYYY-MM-DD");
  const p = d.profile || {};
  need(p.niche, "profile.niche is required");
  need(p.city || p.online_only, "profile.city is required unless profile.online_only is true");
  need(typeof p.hours_per_week === "number" && p.hours_per_week > 0, "profile.hours_per_week must be a number");
  if (p.timezone !== undefined) {
    let tzOk = typeof p.timezone === "string";
    try { if (tzOk) new Intl.DateTimeFormat("en", { timeZone: p.timezone }); } catch { tzOk = false; }
    need(tzOk, "profile.timezone must be an IANA zone such as America/Chicago");
  }
  if (p.intro !== undefined) need(typeof p.intro === "string" && p.intro.length <= 200, "profile.intro must be one line of text, 200 characters at most");
  need(Array.isArray(d.finds) && d.finds.length > 0, "finds must be a non empty array");
  const ids = new Set();
  (d.finds || []).forEach((f, i) => {
    const at = "finds[" + i + "] " + (f && f.name ? "(" + f.name + ")" : "");
    if (!f || typeof f !== "object") { errs.push(at + " is not an object"); return; }
    need(TYPES[f.type], at + ": type must be one of " + Object.keys(TYPES).join(", "));
    need(f.name, at + ": name is required");
    need(f.why, at + ": why is required");
    const s = f.score || {};
    need(int(s.audience, 0, 4), at + ": score.audience must be a whole number 0 to 4");
    need(int(s.reach, 0, 3), at + ": score.reach must be a whole number 0 to 3");
    need(int(s.momentum, 0, 3), at + ": score.momentum must be a whole number 0 to 3");
    need(f.source && isUrl(f.source.url), at + ": source.url must be a full http(s) link");
    need(f.source && f.source.seen, at + ": source.seen (what you saw on that page) is required");
    if (f.contact && f.contact.url) need(isUrl(f.contact.url), at + ": contact.url must be a full link");
    if (f.contact && f.contact.email !== undefined) need(typeof f.contact.email === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(f.contact.email), at + ": contact.email must be a public business email address");
    if (f.type === "event") {
      const e = f.event || {};
      need(DATETIME.test(e.start || ""), at + ": event.start must be YYYY-MM-DD or YYYY-MM-DDTHH:MM");
      if (DATETIME.test(e.start || "") && d.run && DATE.test(d.run.date)) need(e.start.slice(0, 10) >= d.run.date, at + ": event is in the past");
      need(e.venue, at + ": event.venue is required (or \"Online\")");
    }
    if (f.drafts) for (const [k, v] of Object.entries(f.drafts)) need(typeof v === "string" && v.trim(), at + ": drafts." + k + " must be text");
    const id = findId(f);
    need(!ids.has(id), at + ": duplicate find " + id);
    ids.add(id);
  });
  const ref = (where, id) => { if (id !== undefined && id !== null) need(ids.has(id) || ids.has(resolveRef(d, id)), where + ": unknown find \"" + id + "\""); };
  (d.top_moves || []).forEach((m, i) => { need(m && m.text, "top_moves[" + i + "].text is required"); ref("top_moves[" + i + "]", m && m.find); });
  (d.insights || []).forEach((x, i) => { need(x && x.title && x.body, "insights[" + i + "] needs title and body"); (x && x.finds || []).forEach((id) => ref("insights[" + i + "]", id)); });
  (d.creative_moves || []).forEach((x, i) => { need(x && x.title && x.body, "creative_moves[" + i + "] needs title and body"); (x && x.finds || []).forEach((id) => ref("creative_moves[" + i + "]", id)); });
  (d.subniches || []).forEach((x, i) => {
    need(x && x.name, "subniches[" + i + "].name is required");
    need(x && Array.isArray(x.evidence) && x.evidence.length && x.evidence.every((e) => isUrl(e.url)), "subniches[" + i + "].evidence needs at least one item with a full url");
  });
  need(Array.isArray(d.plan) && d.plan.length >= 1 && d.plan.length <= 7, "plan must have 1 to 7 days");
  (d.plan || []).forEach((day, i) => {
    need(day && DATE.test(day.date), "plan[" + i + "].date must be YYYY-MM-DD");
    need(day && typeof day.minutes === "number", "plan[" + i + "].minutes must be a number");
    need(day && Array.isArray(day.actions), "plan[" + i + "].actions must be an array");
    (day && day.actions || []).forEach((a, j) => { need(a && a.text, "plan[" + i + "].actions[" + j + "].text is required"); ref("plan[" + i + "].actions[" + j + "]", a && a.find); });
  });
  if (d.layout) (d.layout.overview || []).forEach((m) => need(MODULES.includes(m), "layout.overview: unknown module \"" + m + "\", use " + MODULES.join(", ")));
  (d.panels || []).forEach((x, i) => need(x && PANEL_TYPES.includes(x.type) && x.title, "panels[" + i + "] needs a title and a type of " + PANEL_TYPES.join(", ")));
  if (d.theme && d.theme.hero) need(!/^https?:/i.test(d.theme.hero), "theme.hero must be a local path inside dashboard/assets/personal/");
  return errs;
}

// A reference may be a full id or just the find's name.
function resolveRef(d, ref) {
  const f = (d.finds || []).find((x) => findId(x) === ref || x.name === ref || slug(x.name) === slug(ref));
  return f ? findId(f) : ref;
}

export function normalize(d) {
  const out = JSON.parse(JSON.stringify(d));
  out.finds = out.finds.map((f) => ({ ...f, id: findId(f), category: TYPES[f.type], total: f.score.audience + f.score.reach + f.score.momentum }));
  const fix = (r) => (r === undefined || r === null ? r : resolveRef(out, r));
  (out.top_moves || []).forEach((m) => { m.find = fix(m.find); });
  (out.insights || []).forEach((x) => { x.finds = (x.finds || []).map(fix); });
  (out.creative_moves || []).forEach((x) => { x.finds = (x.finds || []).map(fix); });
  (out.plan || []).forEach((day) => (day.actions || []).forEach((a) => { a.find = fix(a.find); }));
  return out;
}

// Dates are wall clock values with no zone. Formatting them as UTC keeps them from shifting.
function locale(d) { return /united states|usa|^us$|canada|philippines/i.test((d.profile && d.profile.country) || "") ? "en-US" : "en-GB"; }
export function fmtDate(s, loc, withDay = true) {
  if (!s) return "";
  const [y, m, dd] = s.slice(0, 10).split("-").map(Number);
  const t = s.length > 10 ? s.slice(11, 16).split(":").map(Number) : null;
  const dt = new Date(Date.UTC(y, m - 1, dd, t ? t[0] : 0, t ? t[1] : 0));
  const opts = { timeZone: "UTC", day: "numeric", month: "short" };
  if (withDay) opts.weekday = "short";
  let txt = dt.toLocaleDateString(loc, opts);
  if (t) txt += ", " + dt.toLocaleTimeString(loc, { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
  return txt;
}

const cell = (s) => String(s === undefined || s === null ? "" : s).replace(/\|/g, "/").replace(/\r?\n/g, " ");
const quote = (s) => String(s).trim().split(/\r?\n/).map((l) => "> " + l).join("\n");
const score = (f) => f.score.audience + "/" + f.score.reach + "/" + f.score.momentum + " = " + f.total;
const src = (f) => "[" + cell(f.source.title || "Source") + "](" + f.source.url + "): " + cell(f.source.seen);

export function renderReport(d) {
  const loc = locale(d);
  const p = d.profile;
  const by = (cat) => d.finds.filter((f) => f.category === cat).sort((a, b) => b.total - a.total);
  const name = (id) => { const f = d.finds.find((x) => x.id === id); return f ? f.name : ""; };
  const L = [];
  L.push("# Luck Accelerator report: " + p.niche + (p.city ? ", " + p.city : ""), "");
  if (d.run.note) L.push(d.run.note, "");
  L.push("Run on " + d.run.date + ". Everything here is a draft. Nothing has been sent, joined or posted.", "");
  L.push("## Your profile", "");
  L.push("- **Based in:** " + (p.online_only ? "Online only" : [p.city, p.country].filter(Boolean).join(", ")));
  L.push("- **What you do:** " + p.niche);
  if (p.offer) L.push("- **Offer:** " + p.offer + (p.price ? ", " + p.price : ""));
  if (p.want) L.push("- **Who you want more of:** " + p.want);
  L.push("- **Time each week:** " + p.hours_per_week + " hours");
  if (p.limits && p.limits.length) L.push("- **Limits:** " + p.limits.join("; "));
  if (p.intro) L.push("- **Your one line intro:** " + p.intro);
  L.push("- **Assumptions I made:** " + (p.assumptions || "none"), "");
  if (d.summary) L.push(d.summary, "");
  if (d.top_moves && d.top_moves.length) {
    L.push("## Your top three moves this week", "");
    d.top_moves.forEach((m, i) => L.push((i + 1) + ". " + m.text));
    L.push("");
  }
  if (d.insights && d.insights.length) {
    L.push("## What stands out", "");
    d.insights.forEach((x) => L.push("- **" + x.title + ".** " + x.body));
    L.push("");
  }
  const conn = by("connections");
  if (conn.length) {
    L.push("## 1. High value local connections", "", "| Rank | Who | Why they fit | Score (A/R/M = total) | Source |", "|---|---|---|---|---|");
    conn.forEach((f, i) => L.push("| " + (i + 1) + " | " + cell(f.name + (f.org ? ", " + f.org : "") + (f.role ? " (" + f.role + ")" : "")) + " | " + cell(f.why) + " | " + score(f) + " | " + src(f) + " |"));
    L.push("");
  }
  const ev = by("events");
  if (ev.length) {
    L.push("## 2. Events coming up", "", "| Rank | Event | Date and place | Price | Why go | Score | Source |", "|---|---|---|---|---|---|---|");
    ev.forEach((f, i) => L.push("| " + (i + 1) + " | " + cell(f.name) + " | " + cell(fmtDate(f.event.start, loc) + ", " + f.event.venue) + " | " + cell(f.event.price || "Not shown") + " | " + cell(f.why) + " | " + score(f) + " | " + src(f) + " |"));
    L.push("");
  }
  const com = by("communities");
  if (com.length) {
    L.push("## 3. Online networks and communities", "", "| Rank | Community | Where | Size and activity | Why it fits | Score | Source |", "|---|---|---|---|---|---|---|");
    com.forEach((f, i) => { const c = f.community || {}; L.push("| " + (i + 1) + " | " + cell(f.name) + " | " + cell(c.platform || "") + " | " + cell([c.members, c.last_activity].filter(Boolean).join(", ")) + " | " + cell(f.why) + " | " + score(f) + " | " + src(f) + " |"); });
    L.push("");
  }
  if (d.subniches && d.subniches.length) {
    L.push("## 4. Sub niches worth a look", "");
    d.subniches.forEach((s) => {
      L.push("### " + s.name, "");
      L.push("- **Evidence:** " + s.evidence.map((e) => "[" + cell(e.title || "Source") + "](" + e.url + ")").join(", "));
      if (s.pitch) L.push("- **How you would describe your offer to them:** " + s.pitch);
      L.push("");
    });
  }
  const join = d.finds.filter((f) => f.category === "groups" || f.recommend_join).sort((a, b) => b.total - a.total);
  if (join.length) {
    L.push("## 5. Groups and communities to join", "", "| Rank | Group | Free or paid | How often | Why join | Source |", "|---|---|---|---|---|---|");
    join.forEach((f, i) => { const c = f.community || {}; L.push("| " + (i + 1) + " | " + cell(f.name) + " | " + cell(c.cost || "Not shown") + " | " + cell(c.cadence || c.last_activity || "") + " | " + cell(f.why) + " | " + src(f) + " |"); });
    L.push("");
  }
  const drafted = d.finds.filter((f) => f.drafts && Object.keys(f.drafts).length).sort((a, b) => b.total - a.total);
  if (drafted.length) {
    L.push("## 6. Outreach drafts", "");
    drafted.forEach((f) => {
      const x = f.drafts;
      L.push("### " + f.name, "");
      if (f.contact && f.contact.via) L.push("- **Send via:** " + f.contact.via + (f.contact.url ? " ([link](" + f.contact.url + "))" : "") + (f.contact.email ? ", " + f.contact.email : ""));
      if (f.community && f.community.rules) L.push("- **Rules I saw:** " + f.community.rules);
      if (x.first_message) L.push("- **First message:**", "", quote(x.first_message), "");
      if (x.if_reply) L.push("- **If they reply:** " + x.if_reply);
      if (x.nudge) L.push("- **If there is no reply after a few days:**", "", quote(x.nudge), "");
      if (x.starter) L.push("- **Conversation starter:** \"" + x.starter.replace(/^"|"$/g, "") + "\"");
      if (x.follow_up) L.push("- **Next day follow up:**", "", quote(x.follow_up), "");
      if (x.intro_post) L.push("- **Introduction post:**", "", quote(x.intro_post), "");
      if (x.helpful_answer) L.push("- **Helpful answer (this community bans self promotion):**", "", quote(x.helpful_answer), "");
      if (x.first_comment) L.push("- **A helpful first comment:** " + x.first_comment);
      L.push("");
    });
  }
  if (d.creative_moves && d.creative_moves.length) {
    L.push("## 7. Creative moves", "");
    d.creative_moves.forEach((m, i) => L.push((i + 1) + ". **" + m.title + ".** " + m.body + (m.minutes ? " About " + m.minutes + " minutes." : "")));
    L.push("");
  }
  L.push("## 8. Your movement plan", "", "| Day | Minutes | Do this |", "|---|---|---|");
  d.plan.forEach((day) => L.push("| " + fmtDate(day.date, loc) + " | " + day.minutes + " | " + cell(day.actions.map((a) => a.text + (a.find && name(a.find) && !a.text.includes(name(a.find)) ? " (" + name(a.find) + ")" : "")).join("; ")) + " |"));
  L.push("", "### Scoreboard", "", "| Messages sent | Replies | Events attended | Communities joined | Conversations booked |", "|---|---|---|---|---|", "| | | | | |", "");
  L.push("Your dashboard tracks these for you. Mark each find as you move on it.", "");
  const c = d.checks || {};
  L.push("## How this was checked", "");
  L.push("- **Links:** " + (c.links || "not recorded"));
  L.push("- **Copy:** " + (c.copy || "not recorded"));
  L.push("- **Facts:** " + (c.facts || "dates, venues and prices taken from the linked pages on " + d.run.date + ". Details change, so recheck the page before you go."));
  L.push("");
  return L.join("\n");
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function copyTemplate(dest) {
  const want = fs.readFileSync(path.join(TEMPLATE_DIR, "VERSION"), "utf8").trim();
  const have = fs.existsSync(path.join(dest, "VERSION")) ? fs.readFileSync(path.join(dest, "VERSION"), "utf8").trim() : null;
  if (have === want) return "current";
  const walk = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      const a = path.join(from, e.name), b = path.join(to, e.name);
      if (e.isDirectory()) { if (e.name !== "personal") walk(a, b); }
      else if (!KEEP.has(e.name) || !fs.existsSync(b)) fs.copyFileSync(a, b);
    }
  };
  walk(TEMPLATE_DIR, dest);
  fs.mkdirSync(path.join(dest, "assets", "personal"), { recursive: true });
  return have ? "upgraded " + have + " to " + want : "installed " + want;
}

export function build(folder, runDate) {
  const runsDir = path.join(folder, "runs");
  const runs = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter((n) => DATE.test(n) && fs.existsSync(path.join(runsDir, n, "data.json"))).sort() : [];
  if (!runs.length) throw new Error("no runs/<YYYY-MM-DD>/data.json under " + folder);
  const date = runDate || runs[runs.length - 1];
  if (!runs.includes(date)) throw new Error("no run " + date);
  const raw = readJson(path.join(runsDir, date, "data.json"), null);
  if (!raw) throw new Error("runs/" + date + "/data.json is not valid JSON");
  const errs = validate(raw);
  if (errs.length) { const e = new Error("data.json has " + errs.length + " problem(s)"); e.problems = errs; throw e; }
  const cur = normalize(raw);

  // First seen date for every find across every run up to this one.
  const firstSeen = {};
  const past = {};
  const history = [];
  for (const r of runs.filter((r) => r <= date)) {
    const d = r === date ? cur : readJson(path.join(runsDir, r, "data.json"), null);
    if (!d || !Array.isArray(d.finds)) continue;
    let fresh = 0;
    for (const f of d.finds) {
      const id = findId(f);
      if (!firstSeen[id]) { firstSeen[id] = r; fresh++; }
      if (r !== date) past[id] = { ...f, id, category: TYPES[f.type], total: f.score ? f.score.audience + f.score.reach + f.score.momentum : 0, fromRun: r };
    }
    history.push({ date: r, finds: d.finds.length, fresh });
  }
  for (const f of cur.finds) { f.firstSeen = firstSeen[f.id]; f.isNew = firstSeen[f.id] === date && runs.filter((r) => r <= date).length > 1; }

  // Earlier finds the user is still working on stay visible in the pipeline.
  const progress = readJson(path.join(folder, "progress.json"), null);
  const active = new Set(["saved", "moved", "replied", "met"]);
  const curIds = new Set(cur.finds.map((f) => f.id));
  const carried = progress && progress.items ? Object.entries(progress.items).filter(([id, v]) => active.has(v.status) && !curIds.has(id) && past[id]).map(([id]) => past[id]) : [];

  fs.writeFileSync(path.join(runsDir, date, "report.md"), renderReport(cur));
  const dash = path.join(folder, "dashboard");
  const template = copyTemplate(dash);
  const payload = { generated: new Date().toISOString(), templateVersion: fs.readFileSync(path.join(TEMPLATE_DIR, "VERSION"), "utf8").trim(), locale: locale(cur), current: cur, carried, history, progressSeed: progress };
  fs.writeFileSync(path.join(dash, "data.js"), "// Written by build.mjs. Rebuilt on every run, do not edit by hand.\nwindow.LUCK_DATA = " + JSON.stringify(payload, null, 2).replace(/<\//g, "<\\/") + ";\n");
  return { date, finds: cur.finds.length, carried: carried.length, runs: history.length, template, report: path.join(runsDir, date, "report.md"), dashboard: path.join(dash, "index.html") };
}

function sample() {
  return {
    schema: 1,
    run: { date: "2026-10-28", mode: "first" },
    profile: { city: "Testville", country: "United Kingdom", niche: "Test coach", hours_per_week: 3 },
    finds: [
      { type: "business", name: "Alpha Studio", why: "Shares customers.", score: { audience: 4, reach: 3, momentum: 2 }, source: { url: "https://alpha.example/about", title: "About", seen: "Opened in October" }, drafts: { first_message: "Hi there, how is the new studio going?" } },
      { type: "event", name: "Founders Breakfast", why: "Room full of owners.", score: { audience: 3, reach: 3, momentum: 3 }, source: { url: "https://events.example/b", title: "Event", seen: "Dated 5 Nov" }, event: { start: "2026-11-05T08:00", venue: "Town Hall", price: "Free" } },
    ],
    top_moves: [{ text: "Say hello to Alpha Studio", find: "Alpha Studio" }],
    plan: [{ date: "2026-11-02", minutes: 30, actions: [{ text: "Message Alpha Studio", find: "Alpha Studio" }] }],
  };
}

function selftest() {
  const fails = [];
  const ok = (name, cond) => { if (!cond) fails.push(name); };
  ok("slug", slug("Café & Co. Ltd!") === "cafe-and-co-ltd");
  ok("id", findId({ type: "business", name: "Alpha Studio", source: { url: "https://www.alpha.example/x" } }) === "connections:alpha-studio@alpha.example");
  ok("valid sample", validate(sample()).length === 0);
  const tzBad = sample(); tzBad.profile.timezone = "Mars/Olympus";
  ok("catches a bad zone", validate(tzBad).length === 1);
  const tzGood = sample(); tzGood.profile.timezone = "Europe/London"; tzGood.profile.intro = "I coach busy people to lift."; tzGood.finds[0].contact = { via: "Email", email: "hello@alpha.example" }; tzGood.finds[0].drafts.nudge = "Hi again, hope the week is going well.";
  ok("accepts zone, intro, email and nudge", validate(tzGood).length === 0);
  ok("report carries the nudge", renderReport(normalize(tzGood)).includes("> Hi again, hope the week is going well."));
  const bad = sample(); bad.finds[0].score.audience = 7; bad.finds[1].event.start = "2026-01-01"; bad.plan[0].actions[0].find = "Nobody";
  ok("catches three problems", validate(bad).length === 3);
  const n = normalize(sample());
  ok("resolves names to ids", n.top_moves[0].find === "connections:alpha-studio@alpha.example");
  ok("totals", n.finds[0].total === 9);
  ok("date format", fmtDate("2026-11-05T08:00", "en-GB") === "Thu 5 Nov, 08:00" || fmtDate("2026-11-05T08:00", "en-GB").startsWith("Thu 5 Nov"));
  const rep = renderReport(n);
  ok("report quotes drafts", rep.includes("> Hi there, how is the new studio going?"));
  ok("report lists event", rep.includes("Founders Breakfast"));
  if (fs.existsSync(path.join(TEMPLATE_DIR, "VERSION"))) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "luck-"));
    fs.mkdirSync(path.join(tmp, "runs", "2026-10-28"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "runs", "2026-10-28", "data.json"), JSON.stringify(sample()));
    try {
      const r = build(tmp);
      ok("build writes data.js", fs.readFileSync(path.join(tmp, "dashboard", "data.js"), "utf8").includes("window.LUCK_DATA"));
      ok("build writes report", fs.existsSync(r.report));
      fs.writeFileSync(path.join(tmp, "dashboard", "custom.css"), "/* mine */");
      fs.writeFileSync(path.join(tmp, "dashboard", "VERSION"), "0.0.0");
      build(tmp);
      ok("upgrade keeps custom.css", fs.readFileSync(path.join(tmp, "dashboard", "custom.css"), "utf8") === "/* mine */");
    } catch (e) { fails.push("build threw: " + e.message + (e.problems ? " " + e.problems.join("; ") : "")); }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (fails.length) { process.stdout.write("build selftest: FAIL\n  " + fails.join("\n  ") + "\n"); process.exit(1); }
  process.stdout.write("build selftest: PASS\n");
}

const args = process.argv.slice(2);
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (args.includes("--selftest")) selftest();
  else if (!args[0]) { process.stderr.write("usage: node build.mjs <luck-accelerator folder> [--run YYYY-MM-DD]\n"); process.exit(2); }
  else {
    const i = args.indexOf("--run");
    try {
      const r = build(path.resolve(args[0]), i >= 0 ? args[i + 1] : undefined);
      process.stdout.write("built run " + r.date + ": " + r.finds + " finds, " + r.carried + " carried from earlier runs, " + r.runs + " run(s) in history\n");
      process.stdout.write("dashboard template " + r.template + "\nreport:    " + r.report + "\ndashboard: " + r.dashboard + "\n");
    } catch (e) {
      process.stdout.write("build: FAIL, " + e.message + "\n" + (e.problems ? "  " + e.problems.join("\n  ") + "\n" : ""));
      process.exit(1);
    }
  }
}
