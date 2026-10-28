#!/usr/bin/env node
// Fails on any em dash (U+2014) or en dash (U+2013) in shipped text.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKIP_DIRS = new Set([".git", "node_modules"]);
const TEXT = /\.(md|mjs|js|json|yml|yaml|txt)$/i;
// Built from code points so this file never carries either character itself.
const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

const hits = [];
function walk(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) if (!SKIP_DIRS.has(e)) walk(path.join(p, e));
  } else if (TEXT.test(p) || path.basename(p) === "VERSION") {
    fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      const col = line.search(DASHES);
      if (col >= 0) hits.push(path.relative(ROOT, p) + ":" + (i + 1) + ":" + (col + 1));
    });
  }
}
walk(ROOT);

if (hits.length) {
  process.stdout.write("no-dashes: FAIL, " + hits.length + " dash character(s) found:\n  " + hits.join("\n  ") + "\n");
  process.exit(1);
}
process.stdout.write("no-dashes: PASS\n");
