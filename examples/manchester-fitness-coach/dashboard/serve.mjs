#!/usr/bin/env node
// Serves the Luck Accelerator dashboard on this computer only, and saves progress into the
// user's folder so the next run can read it.
//   node serve.mjs [--port 4747] [--open]   (--open reuses a dashboard already running for this folder)
//   node serve.mjs --selftest
// Binds to 127.0.0.1, so nothing outside this computer can reach it. Serves the files next to this
// script, plus GET and PUT /api/progress, which read and write ../progress.json. No dependencies.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS = path.join(DIR, "..", "progress.json");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const MAX_BODY = 1024 * 1024;

export function safePath(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split("?")[0]); } catch { return null; }
  if (p === "/" || p === "") p = "/index.html";
  const full = path.resolve(DIR, "." + p);
  if (!full.startsWith(DIR + path.sep)) return null;
  if (path.basename(full) === "serve.mjs") return null;
  return full;
}

export function validProgress(o) {
  return !!o && typeof o === "object" && !Array.isArray(o) && typeof (o.items || {}) === "object" && typeof (o.plan || {}) === "object" && Array.isArray(o.log || []);
}

function handler(port) {
  const hosts = new Set(["127.0.0.1:" + port, "localhost:" + port]);
  return (req, res) => {
    // Refuse requests that arrive under another host name, which blocks DNS rebinding.
    if (!hosts.has(req.headers.host || "")) { res.writeHead(403).end("forbidden"); return; }
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("cache-control", "no-store");
    const url = (req.url || "/").split("?")[0];
    if (url === "/api/whoami") { res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ app: "luck-accelerator", dir: DIR })); return; }
    if (url === "/api/progress") {
      if (req.method === "GET") {
        fs.readFile(PROGRESS, "utf8", (err, txt) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(err ? "{}" : txt);
        });
        return;
      }
      if (req.method === "PUT") {
        if (!/^application\/json/.test(req.headers["content-type"] || "")) { res.writeHead(415).end(); return; }
        let body = "";
        let size = 0;
        req.on("data", (c) => { size += c.length; if (size > MAX_BODY) { res.writeHead(413).end(); req.destroy(); } else body += c; });
        req.on("end", () => {
          if (res.writableEnded) return;
          let obj;
          try { obj = JSON.parse(body); } catch { res.writeHead(400).end("bad json"); return; }
          if (!validProgress(obj)) { res.writeHead(400).end("bad progress"); return; }
          const tmp = PROGRESS + ".tmp";
          fs.writeFile(tmp, JSON.stringify(obj, null, 2), (err) => {
            if (err) { res.writeHead(500).end(); return; }
            fs.rename(tmp, PROGRESS, (err2) => { res.writeHead(err2 ? 500 : 204).end(); });
          });
        });
        return;
      }
      res.writeHead(405).end();
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; }
    const file = safePath(url);
    if (!file) { res.writeHead(404).end("not found"); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
      res.end(req.method === "HEAD" ? undefined : buf);
    });
  };
}

function openBrowser(url) {
  const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try { spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref(); } catch { /* the address is printed anyway */ }
}

function start(port, tries, open) {
  const server = http.createServer(handler(port));
  server.on("error", (e) => {
    if (e.code === "EADDRINUSE" && tries > 0) start(port + 1, tries - 1, open);
    else { process.stderr.write("serve: " + e.message + "\n"); process.exit(1); }
  });
  server.listen(port, "127.0.0.1", () => {
    const url = "http://127.0.0.1:" + port + "/";
    process.stdout.write("Luck Accelerator dashboard: " + url + "\nProgress saves to " + PROGRESS + "\n");
    if (open) openBrowser(url);
  });
}

function selftest() {
  const fails = [];
  const ok = (n, c) => { if (!c) fails.push(n); };
  ok("index", safePath("/") === path.join(DIR, "index.html"));
  ok("asset", safePath("/assets/hero.webp") === path.join(DIR, "assets", "hero.webp"));
  ok("no traversal", safePath("/../progress.json") === null);
  ok("no encoded traversal", safePath("/%2e%2e/%2e%2e/secret") === null);
  ok("no server source", safePath("/serve.mjs") === null);
  ok("progress ok", validProgress({ items: {}, plan: {}, log: [] }));
  ok("progress bad", !validProgress([]) && !validProgress({ log: 3 }));
  if (fails.length) { process.stdout.write("serve selftest: FAIL\n  " + fails.join("\n  ") + "\n"); process.exit(1); }
  process.stdout.write("serve selftest: PASS\n");
}

/* The desktop shortcut runs this with --open every time. If this folder's dashboard is already
   being served on one of the ports start() would try, open that one instead of starting another. */
async function running(first, count) {
  for (let port = first; port <= first + count; port++) {
    try {
      const r = await fetch("http://127.0.0.1:" + port + "/api/whoami", { signal: AbortSignal.timeout(400) });
      const j = await r.json();
      if (j && j.app === "luck-accelerator" && j.dir === DIR) return port;
    } catch { /* nothing there, or not ours */ }
  }
  return 0;
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) selftest();
else {
  const i = args.indexOf("--port");
  const port = i >= 0 ? Number(args[i + 1]) : 4747;
  const open = args.includes("--open");
  const live = open ? await running(port, 10) : 0;
  if (live) { openBrowser("http://127.0.0.1:" + live + "/"); process.stdout.write("Luck Accelerator dashboard already open at http://127.0.0.1:" + live + "/\n"); }
  else start(port, 10, open);
}
