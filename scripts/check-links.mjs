#!/usr/bin/env node
// Checks every link in a Luck Accelerator report and sorts it into ok, moved, blocked or dead.
//   node check-links.mjs <report.md> [--json]
//   node check-links.mjs --selftest
// ok: the page answered. moved: it redirected to a site's home page, which usually means the
// event or listing is gone. blocked: the site refuses scripts (LinkedIn, Reddit, Facebook,
// Meetup and others), so the agent must confirm it in a browser. dead: not found,
// server error, or no such host. Exits 1 when any link is dead. No dependencies, Node 18 or newer.
import fs from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const BLOCK_CODES = new Set([401, 403, 406, 429, 451, 999]);
const BOT_WALLED = /(^|\.)(linkedin\.com|reddit\.com|facebook\.com|instagram\.com|meetup\.com|x\.com|twitter\.com|tiktok\.com)$/i;
const TIMEOUT_MS = 20000;
const CONCURRENCY = 6;

export function extractLinks(text) {
  const found = new Set();
  // Drop HTML comments, so template notes do not count as links.
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  const re = /https?:\/\/[^\s<>"'`)\]]+/g;
  for (const m of body.matchAll(re)) {
    let url = m[0].replace(/[.,;:!?]+$/, "");
    found.add(url);
  }
  return [...found];
}

export function classify(url, status, finalUrl, error) {
  let host = "";
  try { host = new URL(url).hostname; } catch { return { verdict: "dead", note: "not a valid URL" }; }
  if (error) {
    if (BOT_WALLED.test(host)) return { verdict: "blocked", note: error };
    if (/abort|timeout/i.test(error)) return { verdict: "blocked", note: "timed out, confirm by hand" };
    return { verdict: "dead", note: error };
  }
  if (status >= 200 && status < 400) {
    // These sites often answer scripts with a 200 block or login page, so a person confirms them.
    if (BOT_WALLED.test(host)) return { verdict: "blocked", note: "HTTP " + status + ", site often shows scripts a block page" };
    if (finalUrl && finalUrl !== url) {
      try {
        const a = new URL(url), b = new URL(finalUrl);
        const wasDeep = a.pathname.replace(/\/+$/, "").length > 0;
        const nowRoot = b.pathname.replace(/\/+$/, "").length === 0;
        if (wasDeep && nowRoot) return { verdict: "moved", note: "redirected to home page " + finalUrl };
      } catch { /* keep ok */ }
    }
    return { verdict: "ok", note: String(status) };
  }
  if (BLOCK_CODES.has(status) || (BOT_WALLED.test(host) && status !== 404 && status !== 410)) {
    return { verdict: "blocked", note: "HTTP " + status + ", site refuses scripts" };
  }
  return { verdict: "dead", note: "HTTP " + status };
}

async function probe(url) {
  for (const method of ["HEAD", "GET"]) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: ctl.signal, headers: { "user-agent": UA, accept: "text/html,*/*" } });
      clearTimeout(timer);
      if (res.body) { try { await res.body.cancel(); } catch { /* ignore */ } }
      // Many servers answer HEAD badly. Only trust a HEAD that says the page is there.
      if (method === "HEAD" && !(res.status >= 200 && res.status < 400)) continue;
      return { status: res.status, finalUrl: res.url };
    } catch (e) {
      clearTimeout(timer);
      if (method === "GET") return { error: e.name === "AbortError" ? "timeout" : (e.cause && e.cause.code) || e.message };
    }
  }
  return { error: "no response" };
}

async function run(file, asJson) {
  const links = extractLinks(fs.readFileSync(file, "utf8"));
  const results = [];
  let next = 0;
  async function worker() {
    while (next < links.length) {
      const url = links[next++];
      const p = await probe(url);
      results.push({ url, ...classify(url, p.status, p.finalUrl, p.error) });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  results.sort((a, b) => links.indexOf(a.url) - links.indexOf(b.url));
  const count = (v) => results.filter((r) => r.verdict === v).length;
  const summary = { total: results.length, ok: count("ok"), moved: count("moved"), blocked: count("blocked"), dead: count("dead") };
  if (asJson) {
    process.stdout.write(JSON.stringify({ summary, results }, null, 2) + "\n");
  } else {
    for (const r of results) process.stdout.write(r.verdict.padEnd(8) + r.url + "  (" + r.note + ")\n");
    process.stdout.write("\n" + summary.total + " links: " + summary.ok + " ok, " + summary.moved + " moved, " + summary.blocked + " blocked, " + summary.dead + " dead\n");
    if (summary.blocked) process.stdout.write("Confirm each blocked link by opening it in a browser before keeping it.\n");
    if (summary.moved) process.stdout.write("A moved link usually means the page is gone. Replace it or remove the find.\n");
  }
  process.exit(summary.dead ? 1 : 0);
}

function selftest() {
  const fails = [];
  const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(name + ": got " + JSON.stringify(got) + ", want " + JSON.stringify(want)); };
  eq("extract", extractLinks("See [a](https://a.com/x). And https://b.org/y, plus <!-- https://c.net --> (https://d.io/z)"), ["https://a.com/x", "https://b.org/y", "https://d.io/z"]);
  eq("ok", classify("https://a.com/x", 200, "https://a.com/x").verdict, "ok");
  eq("moved", classify("https://a.com/event/1", 200, "https://a.com/").verdict, "moved");
  eq("same root ok", classify("https://a.com/", 200, "https://www.a.com/").verdict, "ok");
  eq("403 blocked", classify("https://a.com/x", 403).verdict, "blocked");
  eq("linkedin 999", classify("https://www.linkedin.com/company/x", 999).verdict, "blocked");
  eq("reddit 500", classify("https://www.reddit.com/r/x", 500).verdict, "blocked");
  eq("reddit 200 still confirmed", classify("https://www.reddit.com/r/x", 200, "https://www.reddit.com/r/x").verdict, "blocked");
  eq("reddit 404", classify("https://www.reddit.com/r/x", 404).verdict, "dead");
  eq("404 dead", classify("https://a.com/x", 404).verdict, "dead");
  eq("dns dead", classify("https://nope.invalid/", undefined, undefined, "ENOTFOUND").verdict, "dead");
  eq("timeout blocked", classify("https://a.com/x", undefined, undefined, "timeout").verdict, "blocked");
  if (fails.length) { process.stdout.write("check-links selftest: FAIL\n  " + fails.join("\n  ") + "\n"); process.exit(1); }
  process.stdout.write("check-links selftest: PASS\n");
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) selftest();
else if (!args[0]) { process.stderr.write("usage: node check-links.mjs <report.md> [--json]\n"); process.exit(2); }
else run(args[0], args.includes("--json"));
