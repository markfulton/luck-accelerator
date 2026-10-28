#!/usr/bin/env node
// Checks a Luck Accelerator report against the outreach rules in reference/outreach.md.
//   node copy-check.mjs <report.md>
//   node copy-check.mjs --selftest
// Whole file: no em dashes, en dashes, hype words or hashtags. Every quoted draft (lines that
// start with ">"): no links, no pitch phrases, at most one question, at most 400 characters
// (community posts, marked by "Introduction post", may run to 120 words). Exits 1 on any failure.
// No dependencies, Node 18 or newer.
import fs from "node:fs";

// Built from code points so this file never carries either dash itself.
const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");
const HYPE = /\b(revolutionary|game[ -]?changer|10x|unlock|supercharge|synergy|crush(ing)? it|skyrocket|next[ -]level)\b/i;
const PITCH = /(pick your brain|quick call|hop on a call|jump on a call|\b15 minutes\b|let me know if you('| a)re interested|\bdm me\b|book a call|my portfolio|i help (businesses|companies|people) like)/i;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co\.uk|io|net|org|me)\b\/?)/i;
const HASHTAG = /(^|\s)#[A-Za-z][A-Za-z0-9_]+/;

export function drafts(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let cur = null;
  let kind = "message";
  lines.forEach((line, i) => {
    if (/introduction post/i.test(line)) kind = "post";
    else if (/^#{1,6}\s/.test(line)) kind = "message";
    if (/^\s*>/.test(line)) {
      const body = line.replace(/^\s*>\s?/, "");
      if (!cur) { cur = { start: i + 1, text: body, kind }; out.push(cur); }
      else cur.text += "\n" + body;
    } else {
      if (cur) kind = "message";
      cur = null;
    }
  });
  return out.map((d) => ({ ...d, text: d.text.trim() })).filter((d) => d.text.length);
}

export function check(text) {
  const problems = [];
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  body.split(/\r?\n/).forEach((line, i) => {
    if (DASHES.test(line)) problems.push("line " + (i + 1) + ": em dash or en dash");
    const h = line.match(HYPE);
    if (h) problems.push("line " + (i + 1) + ": hype word \"" + h[0] + "\"");
    if (!/^\s*#{1,6}\s/.test(line) && HASHTAG.test(line.replace(/\]\([^)]*\)/g, ""))) problems.push("line " + (i + 1) + ": hashtag");
  });
  for (const d of drafts(body)) {
    const where = "draft at line " + d.start;
    if (LINK.test(d.text)) problems.push(where + ": contains a link");
    const p = d.text.match(PITCH);
    if (p) problems.push(where + ": pitch phrase \"" + p[0] + "\"");
    const q = (d.text.match(/\?/g) || []).length;
    if (q > 1) problems.push(where + ": " + q + " questions, keep one");
    if (d.kind === "post") {
      const words = d.text.split(/\s+/).filter(Boolean).length;
      if (words > 120) problems.push(where + ": community post is " + words + " words, limit 120");
    } else if (d.text.length > 400) {
      problems.push(where + ": " + d.text.length + " characters, limit 400");
    }
  }
  return problems;
}

function selftest() {
  const fails = [];
  const expect = (name, text, want) => {
    const got = check(text).length;
    if ((want === 0) !== (got === 0)) fails.push(name + ": got " + got + " problem(s)");
  };
  const D = String.fromCharCode(0x2014);
  expect("clean message", "### Sarah\n\n> Hi Sarah, congrats on the new bakery. How's the first month been?\n", 0);
  expect("dash", "Great event " + D + " go.\n", 1);
  expect("hype", "This will unlock growth.\n", 1);
  expect("link in draft", "> Hi Sam, see https://me.com. How are you?\n", 1);
  expect("bare domain in draft", "> Hi Sam, my site is samdesign.com. How are you?\n", 1);
  expect("pitch", "> Hi Sam, could I pick your brain sometime?\n", 1);
  expect("two questions", "> Hi Sam, how are you? Busy week?\n", 1);
  expect("too long", "> " + "a".repeat(401) + "\n", 1);
  expect("long post allowed", "- **Introduction post:**\n\n> " + "word ".repeat(100) + "\n", 0);
  expect("post too long", "- **Introduction post:**\n\n> " + "word ".repeat(130) + "\n", 1);
  expect("hashtag", "Join us #networking\n", 1);
  expect("heading not hashtag", "## 1. Connections\n", 0);
  expect("link outside draft ok", "| 1 | [Page](https://a.com/x) |\n", 0);
  if (fails.length) { process.stdout.write("copy-check selftest: FAIL\n  " + fails.join("\n  ") + "\n"); process.exit(1); }
  process.stdout.write("copy-check selftest: PASS\n");
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) selftest();
else if (!args[0]) { process.stderr.write("usage: node copy-check.mjs <report.md>\n"); process.exit(2); }
else {
  const problems = check(fs.readFileSync(args[0], "utf8"));
  if (problems.length) { process.stdout.write("copy-check: FAIL, " + problems.length + " problem(s)\n  " + problems.join("\n  ") + "\n"); process.exit(1); }
  process.stdout.write("copy-check: PASS\n");
}
