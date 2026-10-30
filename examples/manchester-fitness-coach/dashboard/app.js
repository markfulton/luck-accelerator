// Luck Accelerator dashboard. Core logic: do not edit in a user's folder, use custom.js.
// Reads window.LUCK_DATA (written by build.mjs). Progress is saved in this browser, and also in
// progress.json in the user's folder when the page is opened through serve.mjs.
(() => {
  "use strict";

  const D = window.LUCK_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : null);
  const nowIso = () => new Date().toISOString();

  const ICON = {
    overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4.2"/><circle cx="16" cy="8" r="4.2"/><circle cx="8" cy="16" r="4.2"/><circle cx="16" cy="16" r="4.2"/></svg>',
    week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18M8 14.5h2M14 14.5h2"/></svg>',
    opportunities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z"/></svg>',
    pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>',
    niches: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 3.2 2.2 4.7 3.8 6.3C17.5 10 19 11.8 19 14.6 19 18.7 15.9 22 12 22s-7-3.3-7-7.3c0-2.4 1.1-4.2 2.6-5.6.2 1.7 1 2.9 2.2 3.5C9.4 9.1 10.3 5.2 12 2Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4 6v6c0 4.4 3.4 8.3 8 9.5 4.6-1.2 8-5.1 8-9.5V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  };

  const VIEWS = [
    { key: "overview", label: "Overview", short: "Today" },
    { key: "week", label: "This week", short: "Week" },
    { key: "opportunities", label: "Opportunities", short: "Finds" },
    { key: "pipeline", label: "Pipeline", short: "Pipeline" },
    { key: "niches", label: "Niches and moves", short: "Niches" },
  ];
  const CAT = {
    connections: { label: "People", icon: "person", color: "var(--c-connections)" },
    events: { label: "Events", icon: "calendar", color: "var(--c-events)" },
    communities: { label: "Communities", icon: "chat", color: "var(--c-communities)" },
    groups: { label: "Groups", icon: "flag", color: "var(--c-groups)" },
  };
  const STAGES = ["saved", "moved", "replied", "met"];
  const STAGE_WORDS = {
    connections: { saved: "Saved", moved: "Messaged", replied: "Replied", met: "Met" },
    events: { saved: "Saved", moved: "Going", replied: "Went", met: "Followed up" },
    communities: { saved: "Saved", moved: "Joined", replied: "Introduced", met: "Regular" },
    groups: { saved: "Saved", moved: "Joined", replied: "Attended", met: "Regular" },
  };
  const COLUMN_WORDS = { saved: "Saved for later", moved: "You made the move", replied: "They responded", met: "Connected" };
  const LUCK = { moved: 1, replied: 3, met: 5 };
  const DRAFT_LABELS = { first_message: "First message", if_reply: "If they reply", starter: "Conversation starter", follow_up: "Next day follow up", intro_post: "Introduction post", helpful_answer: "Helpful answer", first_comment: "Helpful first comment" };

  // Theme first, so there is no flash.
  const THEME_KEY = "luck-theme";
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
  function applyTheme(t) { document.documentElement.dataset.theme = t; const b = $("#theme-toggle"); if (b) b.innerHTML = t === "dark" ? ICON.sun : ICON.moon; }
  applyTheme(store.get(THEME_KEY) || "light");

  if (!D || !D.current) {
    $("#view").innerHTML = '<div class="view"><div class="hero"><div class="hero-art"></div><div class="hero-inner"><span class="kicker">Luck favors movement</span><h1>Your dashboard is ready for its <em>first run</em>.</h1><p class="lede">Ask your agent: run the luck accelerator. It will ask five short questions, then fill this page with people, events and communities worth meeting.</p></div></div></div>';
    return;
  }

  const cur = D.current;
  const P0 = cur.profile || {};
  const labels = Object.assign({}, cur.labels || {});
  const catLabel = (c) => labels[c] || CAT[c].label;
  const finds = cur.finds.slice();
  const carried = (D.carried || []).map((f) => Object.assign({}, f, { carried: true }));
  const all = finds.concat(carried);
  const byId = new Map(all.map((f) => [f.id, f]));
  const runDate = cur.run.date;
  const loc = D.locale || "en-GB";

  // Top three per category get the larger dot and the drafts.
  const topIds = new Set();
  Object.keys(CAT).forEach((c) => finds.filter((f) => f.category === c).sort((a, b) => b.total - a.total).slice(0, 3).forEach((f) => topIds.add(f.id)));

  // Dates are wall clock values. Treat them as UTC so nothing shifts.
  const wall = (s) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); const t = s.length > 10 ? s.slice(11, 16).split(":").map(Number) : [0, 0]; return new Date(Date.UTC(y, m - 1, d, t[0], t[1])); };
  const todayYmd = (() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0"); })();
  const fmt = (s, o) => (s ? wall(s).toLocaleDateString(loc, Object.assign({ timeZone: "UTC" }, o)) : "");
  const fmtDay = (s) => fmt(s, { weekday: "short", day: "numeric", month: "short" });
  const fmtTime = (s) => (s && s.length > 10 ? wall(s).toLocaleTimeString(loc, { timeZone: "UTC", hour: "numeric", minute: "2-digit" }) : "");
  const daysFromToday = (s) => Math.round((wall(s) - wall(todayYmd)) / 86400000);

  // Acting on a find: calendars, reminders, directions, prep cards, compose and export.
  // Calendar times are floating (no zone), so they land at the same clock time on the
  // person's own device. Google links add the profile's zone when it is known.
  const FOLLOW_UP_DAYS = 3;
  const TZ = (() => { try { return P0.timezone && Intl.DateTimeFormat(undefined, { timeZone: P0.timezone }) ? P0.timezone : null; } catch { return null; } })();
  const pad2 = (n) => String(n).padStart(2, "0");
  const wallOut = (d) => d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()) + "T" + pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes());
  const addMinutes = (s, m) => wallOut(new Date(wall(s).getTime() + m * 60000));
  const addDays = (ymd, n) => wallOut(new Date(wall(ymd).getTime() + n * 86400000)).slice(0, 10);
  const calStamp = (s) => (s.length > 10 ? s.replace(/[-:]/g, "").slice(0, 13) + "00" : s.replace(/-/g, ""));
  const icsText = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  function icsFold(line) {
    const out = [];
    let rest = line;
    while (rest.length > 73) { out.push(rest.slice(0, 73)); rest = " " + rest.slice(73); }
    out.push(rest);
    return out.join("\r\n");
  }
  /* entry: { uid, title, start, end?, minutes?, location?, description?, url?, alarm? } */
  function calEnd(e) {
    if (e.start.length <= 10) return addDays(e.start, 1);
    return e.end && e.end.length > 10 ? e.end : addMinutes(e.start, e.minutes || 90);
  }
  function icsFile(entries) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Luck Accelerator//Dashboard//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    for (const e of entries) {
      const allDay = e.start.length <= 10;
      lines.push("BEGIN:VEVENT", "UID:" + String(e.uid).replace(/[^A-Za-z0-9.-]+/g, "-") + "@luck-accelerator", "DTSTAMP:" + stamp);
      lines.push((allDay ? "DTSTART;VALUE=DATE:" : "DTSTART:") + calStamp(e.start));
      lines.push((allDay ? "DTEND;VALUE=DATE:" : "DTEND:") + calStamp(calEnd(e)));
      lines.push("SUMMARY:" + icsText(e.title));
      if (e.location) lines.push("LOCATION:" + icsText(e.location));
      if (e.description) lines.push("DESCRIPTION:" + icsText(e.description));
      if (e.url) lines.push("URL:" + e.url);
      if (e.alarm && !allDay) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(e.title), "TRIGGER:-PT" + e.alarm + "M", "END:VALARM");
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.map(icsFold).join("\r\n") + "\r\n";
  }
  function googleCal(e) {
    const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: calStamp(e.start) + "/" + calStamp(calEnd(e)) });
    if (e.description) q.set("details", e.description.slice(0, 1500));
    if (e.location) q.set("location", e.location);
    if (TZ && e.start.length > 10) q.set("ctz", TZ);
    return "https://calendar.google.com/calendar/render?" + q.toString();
  }
  function downloadFile(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  const fileSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "luck";
  const inPerson = (f) => f.event && !/^online\b|zoom|virtual|webinar/i.test(f.event.venue || "") && !/online/i.test(f.event.format || "");
  const mapsUrl = (f) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(f.event.address || [f.event.venue, P0.city].filter(Boolean).join(", "));
  const safeEmail = (s) => (typeof s === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(s) ? s : null);

  /* What goes on the calendar for an event, and for the reminder after it. */
  function eventEntry(f) {
    const e = f.event;
    const parts = [f.why];
    if (P0.intro) parts.push("Your one line intro: " + P0.intro);
    if (f.drafts && f.drafts.starter) parts.push("Conversation starter: " + f.drafts.starter);
    if (e.price) parts.push("Price: " + e.price);
    parts.push("Details: " + f.source.url, "From your Luck Accelerator dashboard.");
    return { uid: f.id + "-event", title: f.name, start: e.start, end: e.end, minutes: 90, location: [e.venue, e.address].filter(Boolean).join(", "), description: parts.join("\n\n"), url: safeUrl(f.source.url) || undefined, alarm: 60 };
  }
  const localYmd = (iso) => { const d = new Date(iso); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); };
  function movedAt(id) {
    for (let i = P.log.length - 1; i >= 0; i--) { const e = P.log[i]; if (e.id === id && e.to === "moved") return e.t; }
    return null;
  }
  /* Finds that need a nudge: a message with no reply after a few days, an event you planned to attend that has passed, a community you joined but have not introduced yourself in. */
  function followUpsDue() {
    const due = [];
    for (const f of all) {
      if (statusOf(f.id) !== "moved") continue;
      const at = movedAt(f.id);
      const days = at ? daysFromToday(localYmd(at)) * -1 : 0;
      if (f.category === "events" && f.event) {
        if (daysFromToday(f.event.start) < 0) due.push({ f, why: "Did you go? Mark it Went and send your follow up.", next: "replied" });
      } else if (f.category === "connections") {
        if (days >= FOLLOW_UP_DAYS) due.push({ f, why: "No reply after " + days + " days. One friendly nudge is fine.", next: "replied" });
      } else if (days >= FOLLOW_UP_DAYS) {
        due.push({ f, why: "Joined " + days + " days ago. Introduce yourself or answer one question.", next: "replied" });
      }
    }
    return due;
  }
  function followUpEntry(f) {
    const at = movedAt(f.id);
    let base = f.event ? addDays(f.event.start.slice(0, 10), 1) : addDays(at ? localYmd(at) : todayYmd, FOLLOW_UP_DAYS);
    if (base < todayYmd) base = todayYmd;
    const text = f.event ? f.drafts && f.drafts.follow_up : f.drafts && (f.drafts.nudge || f.drafts.if_reply);
    const parts = [f.event ? "Follow up with the people you met at " + f.name + "." : "Check whether " + f.name + " replied. If not, send one friendly nudge."];
    if (text) parts.push((f.event ? "Your follow up: " : "Your nudge: ") + text);
    const note = P.items[f.id] && P.items[f.id].note;
    if (note) parts.push("Your notes: " + note);
    if (f.contact && f.contact.url) parts.push("Contact: " + f.contact.url);
    return { uid: f.id + "-follow-up", title: "Follow up: " + f.name, start: base + "T09:00", minutes: 15, description: parts.join("\n\n"), alarm: 10 };
  }

  // Progress
  const KEY = "luck-progress:" + ((P0.niche || "") + "|" + (P0.city || "online")).toLowerCase();
  const MODE = /^https?:$/.test(location.protocol) ? "server" : "file";
  let P = { version: 1, items: {}, plan: {}, log: [] };
  const clean = (p) => ({ version: 1, items: (p && p.items) || {}, plan: (p && p.plan) || {}, log: Array.isArray(p && p.log) ? p.log : [], updated: p && p.updated });
  async function loadProgress() {
    let local = null, server = null;
    try { local = JSON.parse(store.get(KEY)); } catch { /* none */ }
    if (MODE === "server") { try { const r = await fetch("api/progress", { cache: "no-store" }); if (r.ok) server = await r.json(); } catch { /* offline */ } }
    const pick = [server, local, D.progressSeed].filter((x) => x && x.items).sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")))[0];
    P = clean(pick);
  }
  let saveTimer = null;
  function save() {
    P.updated = nowIso();
    store.set(KEY, JSON.stringify(P));
    if (MODE !== "server") return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fetch("api/progress", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(P) })
        .then((r) => { if (!r.ok) throw new Error(r.status); })
        .catch(() => toast("Could not reach your folder. Saved in this browser for now."));
    }, 350);
  }
  const statusOf = (id) => (P.items[id] && P.items[id].status) || "open";
  const rank = (s) => STAGES.indexOf(s);

  // Scores and streaks
  const weekKey = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); return y + "-" + String(Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7)).padStart(2, "0"); };
  const isMove = (e) => e.to === "done" || ["moved", "replied", "met"].includes(e.to);
  function luckTotal() {
    let n = 0;
    for (const v of Object.values(P.items)) n += LUCK[v.status] || 0;
    n += Object.values(P.plan).filter(Boolean).length;
    return n;
  }
  function movesByWeek() {
    const m = {};
    for (const e of P.log) if (isMove(e)) { const k = weekKey(new Date(e.t)); m[k] = (m[k] || 0) + 1; }
    return m;
  }
  function streak() {
    const m = movesByWeek();
    const d = new Date();
    let n = 0;
    if (!m[weekKey(d)]) d.setDate(d.getDate() - 7);
    while (m[weekKey(d)]) { n++; d.setDate(d.getDate() - 7); }
    return n;
  }
  const planKey = (date, i) => "plan:" + runDate + ":" + date + ":" + i;
  const moveKey = (i) => "move:" + runDate + ":" + i;
  const planTotals = () => {
    let total = 0, done = 0, mins = 0, minsDone = 0;
    for (const day of cur.plan) {
      const n = day.actions.length, k = day.actions.filter((_, i) => P.plan[planKey(day.date, i)]).length;
      total += n; done += k; mins += day.minutes; minsDone += n ? Math.round(day.minutes * k / n) : 0;
    }
    return { total, done, mins, minsDone };
  };

  // Small builders
  const coin = (n, cls = "") => '<span class="coin ' + cls + '" aria-label="Fit ' + n + ' out of 10">' + n + "</span>";
  const findChip = (id) => { const f = byId.get(id); return f ? '<button class="find-chip" data-open="' + esc(id) + '" style="--cat:' + CAT[f.category].color + '"><span class="dot"></span>' + esc(f.name) + "</button>" : ""; };
  const subline = (f) => {
    if (f.category === "events" && f.event) return [fmtDay(f.event.start) + (fmtTime(f.event.start) ? ", " + fmtTime(f.event.start) : ""), f.event.venue, f.event.price].filter(Boolean).join(" · ");
    if (f.category === "connections") return [f.org, f.role].filter(Boolean).join(" · ") || (f.contact && f.contact.via) || "";
    const c = f.community || {};
    return [c.platform, c.members, c.last_activity].filter(Boolean).join(" · ");
  };
  const pips = (n, max) => Array.from({ length: max }, (_, i) => '<i class="' + (i < n ? "on" : "") + '"></i>').join("");
  const statusWord = (f, s) => (s === "open" ? (f.isNew ? "New" : "Open") : s === "passed" ? "Not for me" : STAGE_WORDS[f.category][s]);

  function luckMap() {
    // Spread the rings across the scores this run actually has, so close scores still read apart.
    const lo = Math.min(8, ...all.map((f) => f.total));
    const R = (t) => 50 + (10 - Math.max(lo, Math.min(10, t))) / (10 - lo) * 168;
    const cats = Object.keys(CAT);
    let s = '<svg class="luck-map" viewBox="-240 -240 480 480" role="img" aria-label="Your luck map. Each dot is a find. Closer to the centre means a better fit.">';
    s += '<defs><clipPath id="youclip"><circle r="30"/></clipPath></defs>';
    const step = Math.max(1, Math.ceil((10 - lo) / 4));
    for (let t = 10; t >= lo; t -= step) s += '<circle class="ring-line" r="' + R(t).toFixed(1) + '"/><text class="ring-label" x="5" y="' + (-R(t) - 4).toFixed(1) + '">' + t + "</text>";
    cats.forEach((c, i) => {
      const a = (-90 + i * 90) * Math.PI / 180;
      s += '<line class="sector-line" x1="' + (Math.cos(a) * 36).toFixed(1) + '" y1="' + (Math.sin(a) * 36).toFixed(1) + '" x2="' + (Math.cos(a) * 226).toFixed(1) + '" y2="' + (Math.sin(a) * 226).toFixed(1) + '"/>';
    });
    cats.forEach((c, i) => {
      const list = all.filter((f) => f.category === c).sort((a, b) => b.total - a.total);
      list.forEach((f, k) => {
        let h = 0; for (const ch of f.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        const ang = (-90 + i * 90 + (k + 1) * (90 / (list.length + 1)) + ((h % 7) - 3)) * Math.PI / 180;
        const r = R(f.total) + ((h >> 3) % 13) - 6;
        const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
        const st = statusOf(f.id);
        const size = topIds.has(f.id) ? 9 : 6.5;
        const cls = ["node", f.isNew ? "new" : "", st === "passed" ? "passed" : ""].join(" ");
        // Position on the outer group, so the hover scale on .node never replaces the translate.
        s += '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ')"><g class="' + cls + '" data-open="' + esc(f.id) + '" data-tip="' + esc(f.id) + '" tabindex="0" role="button" aria-label="' + esc(f.name + ", fit " + f.total) + '">';
        if (f.isNew) s += '<circle class="pulse" r="' + size + '"/>';
        if (rank(st) >= 1) s += '<circle class="halo" r="' + (size + 4) + '"/>';
        s += '<circle class="body" r="' + size + '" style="fill:' + CAT[c].color + '"/></g></g>';
      });
    });
    s += '<circle r="33" fill="var(--card-solid)" stroke="var(--gold)" stroke-width="1.5"/><image href="assets/coin.webp" x="-40" y="-40" width="80" height="80" clip-path="url(#youclip)" preserveAspectRatio="xMidYMid slice"/>';
    s += "</svg>";
    // Quadrant labels sit in the corners as HTML, so long personal labels never collide.
    const corner = ["tr", "br", "bl", "tl"];
    return '<div class="map-stage">' + s + cats.map((c, i) => '<span class="map-corner ' + corner[i] + '" style="color:' + CAT[c].color + '">' + esc(catLabel(c)) + "</span>").join("") + "</div>";
  }
  function bestFits() {
    const list = all.filter((f) => statusOf(f.id) !== "passed").sort((a, b) => b.total - a.total).slice(0, 7);
    return '<div class="card pad-lg"><div class="card-title"><h3>Closest to the centre</h3><span class="eyebrow">Best fits</span></div><ul class="rank-list">' +
      list.map((f, i) => '<li data-open="' + esc(f.id) + '"><span class="r">' + (i + 1) + '</span><div class="info"><b>' + esc(f.name) + '</b><span><i class="dot" style="--cat:' + CAT[f.category].color + ';display:inline-block;margin-right:6px"></i>' + esc(catLabel(f.category)) + (f.isNew ? " · new" : "") + "</span></div>" + coin(f.total) + "</li>").join("") + "</ul></div>";
  }

  // Overview modules
  const MOD = {
    stats() {
      const pt = planTotals();
      const wk = movesByWeek()[weekKey(new Date())] || 0;
      const target = Math.max(pt.total, 1);
      const pct = Math.min(1, wk / target);
      const C = 2 * Math.PI * 24;
      const convo = Object.values(P.items).filter((v) => v.status === "replied" || v.status === "met").length;
      const st = streak();
      return '<div class="grid grid-4 section">' +
        '<div class="card stat"><div class="stat-art" style="background-image:url(assets/coin.webp)"></div><div><div class="value num">' + luckTotal() + '</div><div class="label">Luck earned. A move is 1, a reply 3, a meeting 5</div></div></div>' +
        '<div class="card stat"><div class="flame">' + ICON.flame + '</div><div><div class="value num">' + st + '</div><div class="label">' + (st === 1 ? "week" : "weeks") + " lucky streak" + (st ? "" : ". One move starts it") + "</div></div></div>" +
        '<div class="card stat"><svg class="ring" viewBox="0 0 56 56"><circle class="track" cx="28" cy="28" r="24"/><circle class="fill" cx="28" cy="28" r="24" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '" transform="rotate(-90 28 28)"/></svg><div><div class="value num">' + wk + "<span class=\"muted\" style=\"font-size:16px\"> / " + target + '</span></div><div class="label">Moves made this week</div></div></div>' +
        '<div class="card stat"><div class="stat-art" style="background-image:url(assets/horseshoe.webp)"></div><div><div class="value num">' + convo + '</div><div class="label">Conversations and connections</div></div></div>' +
        "</div>";
    },
    map() {
      return '<div class="card pad-lg map-wrap"><div class="card-title"><div><h3>Your luck map</h3><p class="muted" style="font-size:13.5px">Closer to the centre means a better fit. Tap any dot.</p></div></div>' + luckMap() +
        '<div class="legend">' + Object.keys(CAT).map((c) => '<span><i class="dot" style="--cat:' + CAT[c].color + '"></i>' + esc(catLabel(c)) + "</span>").join("") + '<span><i class="ring-key"></i>You moved on it</span></div></div>';
    },
    moves() {
      const rows = (cur.top_moves || []).map((m, i) => {
        const done = !!P.plan[moveKey(i)];
        return '<div class="move ' + (done ? "done" : "") + '"><input class="check" type="checkbox" data-check="' + moveKey(i) + '" ' + (done ? "checked" : "") + ' aria-label="Done"><span class="idx">' + (i + 1) + '</span><div class="text">' + esc(m.text) + (m.find ? '<div class="chip-row">' + findChip(m.find) + "</div>" : "") + "</div></div>";
      }).join("");
      return '<div class="card pad-lg"><div class="card-title"><h3>Your top three moves</h3><span class="eyebrow">This week</span></div>' + rows +
        '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn small primary" data-go="week">' + ICON.week + "See the full week</button><button class=\"btn small\" data-go=\"opportunities\">" + ICON.opportunities + "All opportunities</button></div></div>";
    },
    insights() {
      if (!cur.insights || !cur.insights.length) return "";
      return '<div class="section"><div class="section-head"><h2>What stands out</h2><p>Patterns across this week\'s finds</p></div><div class="grid grid-fit">' +
        cur.insights.map((x) => '<div class="card insight"><div class="eyebrow">' + ICON.spark.replace("<svg", '<svg width="12" height="12"') + "Insight</div><h3>" + esc(x.title) + "</h3><p>" + esc(x.body) + "</p><div class=\"chip-row\">" + (x.finds || []).map(findChip).join("") + "</div></div>").join("") + "</div></div>";
    },
    panels() {
      if (!cur.panels || !cur.panels.length) return "";
      return '<div class="section grid grid-fit">' + cur.panels.map(panel).join("") + "</div>";
    },
    week() {
      return '<div class="section"><div class="section-head"><h2>Your week at a glance</h2><p>Tap a day to open it</p></div><div class="week-mini">' + cur.plan.map((day) => {
        const n = day.actions.length, k = day.actions.filter((_, i) => P.plan[planKey(day.date, i)]).length;
        return '<button class="mini ' + (day.date === todayYmd ? "today" : "") + '" data-go="week"><b>' + esc(fmt(day.date, { weekday: "short" })) + "</b><span>" + esc(fmt(day.date, { day: "numeric" })) + '</span><div class="bar"><i style="width:' + (n ? Math.round(100 * k / n) : 0) + '%"></i></div></button>';
      }).join("") + "</div></div>";
    },
    scoreboard() {
      const m = movesByWeek();
      const weeks = [];
      const d = new Date();
      for (let i = 7; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i * 7); weeks.push({ k: weekKey(x), label: x.toLocaleDateString(loc, { day: "numeric", month: "short" }), now: i === 0 }); }
      const max = Math.max(1, ...weeks.map((w) => m[w.k] || 0));
      const hist = D.history || [];
      const hmax = Math.max(1, ...hist.map((h) => h.finds));
      return '<div class="section grid grid-2"><div class="card pad-lg"><div class="card-title"><h3>Moves by week</h3><span class="eyebrow">Last 8 weeks</span></div><div class="spark">' +
        weeks.map((w) => '<div class="col ' + (w.now ? "now" : "") + '" title="' + (m[w.k] || 0) + ' moves"><i style="height:' + Math.max(4, Math.round(70 * (m[w.k] || 0) / max)) + 'px"></i><span>' + esc(w.label) + "</span></div>").join("") + "</div></div>" +
        '<div class="card pad-lg"><div class="card-title"><h3>Runs so far</h3><span class="eyebrow">' + hist.length + " run" + (hist.length === 1 ? "" : "s") + '</span></div><div class="bars">' +
        hist.slice(-6).map((h) => '<div class="bar-row"><span>' + esc(fmt(h.date, { day: "numeric", month: "short", year: "numeric" })) + '</span><div class="track"><i style="width:' + Math.round(100 * h.finds / hmax) + '%"></i></div><span class="v">' + h.finds + "</span></div>").join("") +
        '</div><p class="muted" style="font-size:12.5px;margin-top:12px">Each run adds new finds and skips anything you already acted on.</p></div></div>';
    },
  };

  function panel(p) {
    const t = "<h3>" + esc(p.title) + "</h3>";
    if (p.type === "stat") return '<div class="card"><div class="eyebrow">' + esc(p.title) + '</div><div class="stat" style="margin-top:8px"><div class="value num">' + esc(p.value) + "</div></div>" + (p.caption ? '<p class="muted" style="margin-top:6px;font-size:13.5px">' + esc(p.caption) + "</p>" : "") + "</div>";
    if (p.type === "list") return '<div class="card">' + t + '<ul class="rank-list" style="margin-top:6px">' + (p.items || []).map((it) => { const u = safeUrl(it.url); return '<li style="cursor:default">' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(it.text) + "</a>" : esc(it.text)) + "</li>"; }).join("") + "</ul></div>";
    if (p.type === "bars") { const max = Math.max(1, ...(p.items || []).map((i) => Number(i.value) || 0)); return '<div class="card">' + t + '<div class="bars" style="margin-top:10px">' + (p.items || []).map((i) => '<div class="bar-row"><span>' + esc(i.label) + '</span><div class="track"><i style="width:' + Math.round(100 * (Number(i.value) || 0) / max) + '%"></i></div><span class="v">' + esc(i.value) + "</span></div>").join("") + "</div></div>"; }
    return '<div class="card insight"><div class="eyebrow">' + esc(p.eyebrow || "Note") + "</div>" + t + "<p>" + esc(p.body) + "</p></div>";
  }

  function hero() {
    const h = new Date().getHours();
    const hello = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    const fresh = finds.filter((f) => f.isNew).length;
    const open = finds.filter((f) => statusOf(f.id) === "open").length;
    const headline = fresh ? hello + ". <em>" + fresh + " new openings</em> since your last run." : hello + ". <em>" + open + " openings</em> are waiting for you.";
    const kicker = (cur.theme && cur.theme.kicker) || (P0.city ? "Your " + P0.city + " week" : "Your week");
    const banner = MODE === "file" ? '<div class="banner">' + ICON.hand + "<span>Progress is saved in this browser. To keep it in your folder too, ask your agent: <b>open my luck dashboard</b>.</span></div>" : "";
    return '<section class="hero"><div class="hero-art"></div><div class="hero-inner"><span class="kicker">' + ICON.overview.replace("<svg", '<svg width="14" height="14"') + esc(kicker) + "</span><h1>" + headline + '</h1><p class="lede">' + esc(cur.summary || "Here is who to meet, where to show up and what to say. Every move is yours to make.") + '</p><div class="hero-actions"><button class="btn primary" data-go="week">' + ICON.week + "Start this week's moves</button><button class=\"btn\" data-go=\"opportunities\">" + ICON.opportunities + "Browse every find</button></div>" +
      '<div class="hero-meta"><span>Updated ' + esc(fmt(runDate, { weekday: "long", day: "numeric", month: "long" })) + "</span><span>" + finds.length + " finds checked on their own pages</span>" + (carried.length ? "<span>" + carried.length + " carried from earlier runs</span>" : "") + "</div>" + banner + "</div></section>";
  }

  /* Shown above everything else whenever something is waiting on the person. */
  function followUpsModule() {
    const due = followUpsDue();
    if (!due.length) return "";
    return '<div class="section"><div class="card pad-lg due-card"><div class="card-title"><h3>' + due.length + " follow up" + (due.length === 1 ? "" : "s") + ' waiting on you</h3><span class="eyebrow">Due now</span></div><ul class="rank-list">' +
      due.map((d) => '<li data-open="' + esc(d.f.id) + '"><span class="dot" style="--cat:' + CAT[d.f.category].color + '"></span><div class="info"><b>' + esc(d.f.name) + "</b><span>" + esc(d.why) + '</span></div><span class="btn small">Open</span></li>').join("") +
      "</ul></div></div>";
  }

  function overview() {
    const order = (cur.layout && cur.layout.overview && cur.layout.overview.length ? cur.layout.overview : ["stats", "map", "moves", "insights", "week", "panels", "scoreboard"]).filter((m) => MOD[m]);
    let out = hero() + followUpsModule();
    for (let i = 0; i < order.length; i++) {
      const a = order[i], b = order[i + 1];
      if ((a === "map" && b === "moves") || (a === "moves" && b === "map")) { out += '<div class="section grid grid-2">' + MOD[a]() + MOD[b]() + "</div>"; i++; continue; }
      if (a === "map") { out += '<div class="section grid grid-2">' + MOD.map() + bestFits() + "</div>"; continue; }
      const html = MOD[a]();
      out += a === "moves" ? '<div class="section">' + html + "</div>" : html;
    }
    return out;
  }

  function week() {
    const pt = planTotals();
    const days = cur.plan.slice().sort((a, b) => a.date.localeCompare(b.date));
    const evts = all.filter((f) => f.category === "events" && f.event);
    return '<div class="section"><div class="section-head"><h2>This week</h2><p>' + esc(fmt(days[0].date, { day: "numeric", month: "long" })) + " to " + esc(fmt(days[days.length - 1].date, { day: "numeric", month: "long" })) + '</p></div><div class="card"><div class="week-head"><div><b class="num">' + pt.done + " of " + pt.total + '</b> <span class="muted">actions done, about ' + pt.minsDone + " of " + pt.mins + ' minutes</span></div><div class="progress"><span style="width:' + (pt.total ? Math.round(100 * pt.done / pt.total) : 0) + '%"></span></div></div>' +
      '<div class="cal-bar"><span>' + ICON.calendar + 'Put this week in your calendar, with each day\'s moves as one block at</span><select class="select" id="block-hour" aria-label="Start time for each day">' + [7, 8, 9, 10, 12, 13, 17, 18, 19].map((h) => '<option value="' + h + '"' + (h === 9 ? " selected" : "") + ">" + esc(wall(todayYmd + "T" + pad2(h) + ":00").toLocaleTimeString(loc, { timeZone: "UTC", hour: "numeric", minute: "2-digit" })) + "</option>").join("") + '</select><button class="btn small primary" data-week-ics>' + ICON.download + 'Download for any calendar</button><span class="muted cal-note">Works with Google Calendar (import), Apple Calendar and Outlook. Events come with their real times.</span></div>' +
      "</div></div>" +
      '<div class="week">' + days.map((day) => {
        const isToday = day.date === todayYmd;
        const dayEvents = evts.filter((f) => f.event.start.slice(0, 10) === day.date);
        return '<div class="card day ' + (isToday ? "today" : "") + '"><div class="day-head"><div><div class="day-name">' + esc(fmt(day.date, { weekday: "long" })) + '</div><div class="day-date">' + esc(fmt(day.date, { day: "numeric", month: "short" })) + (isToday ? ' · <span class="today-tag">Today</span>' : "") + '</div></div><span class="mins">' + day.minutes + " min</span></div>" +
          dayEvents.map((f) => '<button class="event-pill" data-open="' + esc(f.id) + '"><time>' + esc(fmtTime(f.event.start) || "All day") + "</time>" + esc(f.name) + "</button>").join("") +
          day.actions.map((a, i) => { const k = planKey(day.date, i); const done = !!P.plan[k]; const id = "c" + k.replace(/[^a-z0-9]/gi, ""); return '<div class="action ' + (done ? "done" : "") + '"><input class="check" type="checkbox" id="' + id + '" data-check="' + esc(k) + '" ' + (done ? "checked" : "") + '><div><label for="' + id + '">' + esc(a.text) + "</label>" + (a.find ? '<div class="chip-row">' + findChip(a.find) + "</div>" : "") + "</div></div>"; }).join("") +
          "</div>";
      }).join("") + "</div>" +
      (cur.creative_moves && cur.creative_moves.length ? '<div class="section"><div class="section-head"><h2>If you have extra time</h2><p>Bigger moves that compound</p></div><div class="grid grid-3">' + cur.creative_moves.map(moveCard).join("") + "</div></div>" : "");
  }

  const F = { cat: "all", q: "", sort: "fit", fresh: false };
  function opportunities() {
    const counts = { all: finds.length };
    Object.keys(CAT).forEach((c) => { counts[c] = finds.filter((f) => f.category === c).length; });
    const anyNew = finds.some((f) => f.isNew);
    let list = finds.filter((f) => (F.cat === "all" || f.category === F.cat) && (!F.fresh || f.isNew));
    if (F.q) { const q = F.q.toLowerCase(); list = list.filter((f) => [f.name, f.org, f.role, f.why, subline(f), (f.tags || []).join(" ")].join(" ").toLowerCase().includes(q)); }
    const soon = (f) => (f.event ? f.event.start : "9999");
    list.sort((a, b) => {
      const pa = statusOf(a.id) === "passed", pb = statusOf(b.id) === "passed";
      if (pa !== pb) return pa ? 1 : -1;
      if (F.sort === "soon") return soon(a).localeCompare(soon(b)) || b.total - a.total;
      if (F.sort === "new") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.total - a.total;
      return b.total - a.total;
    });
    const chip = (k, label) => '<button class="chip" data-filter="' + k + '" aria-pressed="' + (F.cat === k) + '">' + (k !== "all" ? '<span class="dot" style="--cat:' + CAT[k].color + '"></span>' : "") + esc(label) + ' <span class="n">' + counts[k] + "</span></button>";
    return '<div class="section"><div class="section-head"><h2>Opportunities</h2><p>Every find was confirmed on its own page</p></div></div>' +
      '<div class="toolbar"><div class="chips">' + chip("all", "All") + Object.keys(CAT).filter((c) => counts[c]).map((c) => chip(c, catLabel(c))).join("") + (anyNew ? '<button class="chip" data-fresh aria-pressed="' + F.fresh + '">New only</button>' : "") + "</div>" +
      '<label class="search">' + ICON.search + '<span class="sr">Search finds</span><input id="q" type="search" placeholder="Search names, places, notes" value="' + esc(F.q) + '"></label>' +
      '<select class="select" id="sort" aria-label="Sort"><option value="fit"' + (F.sort === "fit" ? " selected" : "") + '>Best fit first</option><option value="soon"' + (F.sort === "soon" ? " selected" : "") + '>Soonest events</option><option value="new"' + (F.sort === "new" ? " selected" : "") + ">Newest first</option></select></div>" +
      (list.length ? '<div class="cards">' + list.map(card).join("") + "</div>" : '<div class="card empty"><img src="assets/coin.webp" alt=""><p>Nothing matches. Try another filter.</p></div>');
  }

  function card(f) {
    const st = statusOf(f.id);
    return '<article class="card find" data-open="' + esc(f.id) + '" style="--cat:' + CAT[f.category].color + ';' + (st === "passed" ? "opacity:.55" : "") + '" tabindex="0">' +
      '<div class="find-top"><div class="who"><div class="kicker-row"><span class="cat-label">' + ICON[CAT[f.category].icon].replace("<svg", '<svg width="13" height="13"') + esc(catLabel(f.category)) + "</span>" + (f.isNew ? '<span class="badge-new">New</span>' : "") + "</div><h3>" + esc(f.name) + '</h3><div class="sub">' + esc(subline(f)) + "</div></div>" + coin(f.total) + "</div>" +
      '<p class="why">' + esc(f.why) + "</p>" +
      '<div class="find-foot"><div class="parts"><div class="part">Audience<div class="pips">' + pips(f.score.audience, 4) + '</div></div><div class="part">Reach<div class="pips">' + pips(f.score.reach, 3) + '</div></div><div class="part">Momentum<div class="pips">' + pips(f.score.momentum, 3) + '</div></div></div><span class="status-pill ' + st + '">' + esc(statusWord(f, st)) + "</span></div></article>";
  }

  function pipeline() {
    const col = (s) => {
      const list = all.filter((f) => statusOf(f.id) === s).sort((a, b) => b.total - a.total);
      const worth = list.length * (LUCK[s] || 0);
      return '<div class="column"><div class="column-head"><b>' + esc(COLUMN_WORDS[s]) + '</b><span class="count">' + list.length + (worth ? ' · <span class="worth">' + worth + " luck</span>" : "") + "</span></div>" +
        (list.length ? list.map((f) => {
          const i = rank(s);
          const next = STAGES[i + 1], prev = STAGES[i - 1];
          return '<div class="mini-card" style="--cat:' + CAT[f.category].color + '"><div class="name" data-open="' + esc(f.id) + '">' + esc(f.name) + '</div><div class="meta"><span>' + esc(catLabel(f.category)) + "</span><span>fit " + f.total + "</span>" + (f.carried ? '<span class="badge-carry">From ' + esc(fmt(f.fromRun, { day: "numeric", month: "short" })) + "</span>" : "") + '</div><div class="moves">' +
            (prev ? '<button data-status="' + prev + '" data-id="' + esc(f.id) + '">Back</button>' : '<button data-status="open" data-id="' + esc(f.id) + '">Unsave</button>') +
            (next ? '<button data-status="' + next + '" data-id="' + esc(f.id) + '">' + esc(STAGE_WORDS[f.category][next]) + "</button>" : "") + "</div></div>";
        }).join("") : '<div class="empty"><img src="assets/horseshoe.webp" alt=""><div>' + (s === "saved" ? "Save finds you like from Opportunities." : "Nothing here yet.") + "</div></div>") + "</div>";
    };
    const passed = all.filter((f) => statusOf(f.id) === "passed");
    return '<div class="section"><div class="section-head"><h2>Pipeline</h2><p>Move each find along as things happen</p></div><div class="board">' + STAGES.map(col).join("") + "</div>" +
      (passed.length ? '<div class="passed-row">Not for me: ' + passed.map((f) => esc(f.name) + ' <button class="btn small ghost" data-status="open" data-id="' + esc(f.id) + '">Restore</button>').join(" ") + "</div>" : "") + "</div>";
  }

  function moveCard(m, i) {
    return '<div class="card move-card"><div class="num-badge">' + (i + 1) + "</div><h3>" + esc(m.title) + "</h3><p>" + esc(m.body) + "</p>" + (m.minutes ? '<p class="muted" style="margin-top:8px;font-size:13px">About ' + esc(m.minutes) + " minutes</p>" : "") + "<div class=\"chip-row\">" + (m.finds || []).map(findChip).join("") + "</div></div>";
  }

  function niches() {
    const join = finds.filter((f) => f.category === "groups" || f.recommend_join).sort((a, b) => b.total - a.total);
    return '<div class="section"><div class="section-head"><h2>Sub niches worth a look</h2><p>Narrower slices where your offer stands out</p></div><div class="grid grid-3">' +
      (cur.subniches || []).map((s) => '<div class="card niche"><h3>' + ICON.niches.replace("<svg", '<svg width="18" height="18" style="color:var(--gold)"') + esc(s.name) + "</h3>" + (s.pitch ? '<p class="pitch">' + esc(s.pitch) + "</p>" : "") + '<div class="evidence">' + (s.evidence || []).map((e) => { const u = safeUrl(e.url); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + ICON.out + esc(e.title || u) + "</a>" : ""; }).join("") + "</div></div>").join("") + "</div></div>" +
      (cur.creative_moves && cur.creative_moves.length ? '<div class="section"><div class="section-head"><h2>Creative moves</h2><p>Ideas that go beyond a message</p></div><div class="grid grid-3">' + cur.creative_moves.map(moveCard).join("") + "</div></div>" : "") +
      (join.length ? '<div class="section"><div class="section-head"><h2>Groups and communities to join</h2><p>Places where showing up every week pays off</p></div><div class="card"><ul class="rank-list">' + join.map((f, i) => { const c = f.community || {}; return '<li data-open="' + esc(f.id) + '"><span class="r">' + (i + 1) + '</span><div class="info"><b>' + esc(f.name) + "</b><span>" + esc([c.platform, c.cost, c.cadence || c.last_activity].filter(Boolean).join(" · ")) + "</span></div>" + coin(f.total) + "</li>"; }).join("") + "</ul></div></div>" : "");
  }

  // Drawer
  function actionsHtml(f) {
    const link = (href, icon, label) => (href ? '<a class="act" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon + esc(label) + "</a>" : "");
    const act = (kind, icon, label) => '<button class="act" type="button" data-act="' + kind + '" data-id="' + esc(f.id) + '">' + icon + esc(label) + "</button>";
    const d = f.drafts || {};
    const out = [];
    if (f.category === "events" && f.event) {
      out.push(link(googleCal(eventEntry(f)), ICON.calendar, "Add to Google Calendar"));
      out.push(act("ics-event", ICON.download, "Apple or Outlook (.ics)"));
      if (inPerson(f)) out.push(link(mapsUrl(f), ICON.pin, "Directions"));
      out.push(link(googleCal(followUpEntry(f)), ICON.bell, "Follow up reminder, next day"));
    } else {
      const contactUrl = safeUrl(f.contact && f.contact.url);
      const email = safeEmail(f.contact && f.contact.email);
      if (d.first_message && contactUrl) out.push(act("copy-open", ICON.out, "Copy message, open contact page"));
      if (d.first_message && email) out.push(link("mailto:" + email + "?body=" + encodeURIComponent(d.first_message), ICON.mail, "Open in my email app"));
      if ((d.intro_post || d.helpful_answer) && safeUrl(f.source.url)) out.push(act("copy-open", ICON.out, d.intro_post ? "Copy intro, open community" : "Copy answer, open community"));
      out.push(link(googleCal(followUpEntry(f)), ICON.bell, "Follow up reminder in " + FOLLOW_UP_DAYS + " days"));
      out.push(act("ics-follow", ICON.download, "Reminder for Apple or Outlook (.ics)"));
    }
    out.push(act("print", ICON.print, "Print a prep card"));
    return '<div><h4>Make it happen</h4><div class="act-grid">' + out.filter(Boolean).join("") + "</div></div>";
  }

  /* A one page card to print or save as PDF before an event or a meeting. */
  function printCard(f) {
    let el = $("#print-card");
    if (!el) { el = document.createElement("section"); el.id = "print-card"; document.body.appendChild(el); }
    const e = f.event, d = f.drafts || {};
    const row = (k, v) => (v ? "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>" : "");
    el.innerHTML = '<p class="pc-kicker">Luck Accelerator prep card · ' + esc(catLabel(f.category)) + "</p><h1>" + esc(f.name) + "</h1>" +
      "<dl>" + (e ? row("When", fmt(e.start, { weekday: "long", day: "numeric", month: "long" }) + (fmtTime(e.start) ? ", " + fmtTime(e.start) : "")) + row("Where", [e.venue, e.address].filter(Boolean).join(", ")) + row("Price", e.price) + (inPerson(f) ? row("Directions", mapsUrl(f)) : "") : row("Who", [f.org, f.role].filter(Boolean).join(", "))) +
      row("Why it fits", f.why) + row("Your one line intro", P0.intro) + row("Contact", f.contact && (f.contact.via + (f.contact.url ? " " + f.contact.url : ""))) + row("Source", f.source.url) + "</dl>" +
      Object.keys(DRAFT_LABELS).filter((k) => d[k]).map((k) => "<h2>" + esc(DRAFT_LABELS[k]) + "</h2><p>" + esc(d[k]) + "</p>").join("") +
      ((P.items[f.id] && P.items[f.id].note) ? "<h2>Your notes</h2><p>" + esc(P.items[f.id].note) + "</p>" : "") +
      '<p class="pc-foot">Every message here is a draft. You send it, in your own words.</p>';
    document.body.classList.add("print-mode");
    const done = () => { document.body.classList.remove("print-mode"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1500);
  }

  function weekEntries(hour) {
    const days = cur.plan.slice().sort((a, b) => a.date.localeCompare(b.date));
    const first = days[0].date, last = days[days.length - 1].date;
    const out = [];
    for (const day of days) {
      if (!day.minutes) continue;
      out.push({ uid: "plan-" + day.date, title: "Luck moves, " + day.minutes + " min", start: day.date + "T" + pad2(hour) + ":00", minutes: day.minutes, description: day.actions.map((a) => "- " + a.text).join("\n") + "\n\nOpen your luck dashboard to tick them off.", alarm: 10 });
    }
    for (const f of all) if (f.category === "events" && f.event && f.event.start.slice(0, 10) >= first && f.event.start.slice(0, 10) <= last) out.push(eventEntry(f));
    return out;
  }

  function exportCsv() {
    const cell = (v) => '"' + String(v === undefined || v === null ? "" : v).replace(/"/g, '""') + '"';
    const head = ["Name", "Section", "Fit", "Status", "Date", "Where", "Why it fits", "Contact", "Source", "Notes"];
    const rows = all.map((f) => [f.name, catLabel(f.category), f.total, statusWord(f, statusOf(f.id)), f.event ? f.event.start.replace("T", " ") : "", f.event ? f.event.venue : (f.community && f.community.platform) || f.org || "", f.why, f.contact ? [f.contact.via, f.contact.url, safeEmail(f.contact.email)].filter(Boolean).join(" ") : "", f.source.url, (P.items[f.id] && P.items[f.id].note) || ""]);
    downloadFile("luck-accelerator-" + runDate + ".csv", "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n"), "text/csv");
    toast("Saved a spreadsheet of every find.");
  }

  let openId = null;
  function drawer(id) {
    const f = byId.get(id);
    if (!f) return;
    openId = id;
    const st = statusOf(id);
    const c = f.community || {}, e = f.event || {};
    const facts = [];
    if (f.category === "events") { facts.push(["When", fmt(e.start, { weekday: "long", day: "numeric", month: "long" }) + (fmtTime(e.start) ? ", " + fmtTime(e.start) : "")]); if (e.recurring) facts.push(["Repeats", e.recurring]); facts.push(["Where", e.venue]); if (e.price) facts.push(["Price", e.price]); if (e.format) facts.push(["Format", e.format]); const dd = daysFromToday(e.start); facts.push(["Countdown", dd === 0 ? "Today" : dd === 1 ? "Tomorrow" : dd > 1 ? "In " + dd + " days" : "Passed"]); }
    else if (f.category === "connections") { if (f.org) facts.push(["Business", f.org]); if (f.role) facts.push(["Role", f.role]); }
    else { if (c.platform) facts.push(["Where", c.platform]); if (c.members) facts.push(["Members", c.members]); if (c.last_activity) facts.push(["Last active", c.last_activity]); if (c.cost) facts.push(["Cost", c.cost]); if (c.cadence) facts.push(["Meets", c.cadence]); if (c.rules) facts.push(["Rules", c.rules]); }
    const src = safeUrl(f.source && f.source.url);
    const contactUrl = safeUrl(f.contact && f.contact.url);
    const drafts = Object.keys(DRAFT_LABELS).filter((k) => f.drafts && f.drafts[k]);
    const note = (P.items[id] && P.items[id].note) || "";
    const words = STAGE_WORDS[f.category];
    $("#drawer").innerHTML =
      '<div class="drawer-head" style="--cat:' + CAT[f.category].color + '">' + coin(f.total, "lg") + '<div class="who"><div class="kicker-row"><span class="cat-label">' + esc(catLabel(f.category)) + "</span>" + (f.isNew ? '<span class="badge-new">New</span>' : "") + (f.carried ? '<span class="badge-carry">From your ' + esc(fmt(f.fromRun, { day: "numeric", month: "short" })) + " run</span>" : "") + "</div><h2>" + esc(f.name) + '</h2><div class="muted" style="font-size:13.5px">' + esc(subline(f)) + '</div></div><button class="icon-btn" data-close aria-label="Close">' + ICON.close + "</button></div>" +
      '<div class="drawer-body">' +
      "<div><h4>Why it fits</h4><p style=\"margin:0;font-size:15px\">" + esc(f.why) + "</p></div>" +
      '<div class="score-break"><div><b>' + f.score.audience + '<span class="muted" style="font-size:13px"> / 4</span></b><span>Audience</span></div><div><b>' + f.score.reach + '<span class="muted" style="font-size:13px"> / 3</span></b><span>Reach</span></div><div><b>' + f.score.momentum + '<span class="muted" style="font-size:13px"> / 3</span></b><span>Momentum</span></div></div>' +
      (facts.length ? '<div><h4>Details</h4><dl class="facts">' + facts.map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("") + "</dl></div>" : "") +
      "<div><h4>Your move</h4><div class=\"statuses\">" + STAGES.map((s) => '<button data-status="' + s + '" data-id="' + esc(id) + '" aria-pressed="' + (st === s) + '">' + esc(words[s]) + (LUCK[s] ? '<span class="plus">+' + LUCK[s] + "</span>" : "") + "</button>").join("") + '<button data-status="passed" data-id="' + esc(id) + '" aria-pressed="' + (st === "passed") + '">Not for me</button></div></div>' +
      actionsHtml(f) +
      (drafts.length ? "<div><h4>Ready to send, by you</h4><div style=\"display:flex;flex-direction:column;gap:10px\">" + drafts.map((k) => '<div class="draft"><div class="draft-head"><b>' + esc(DRAFT_LABELS[k]) + '</b><button class="copy-btn" data-copy="' + k + '">' + ICON.copy + "Copy</button></div><p>" + esc(f.drafts[k]) + "</p></div>").join("") + "</div></div>" : "") +
      (f.contact && f.contact.via ? '<div><h4>How to reach them</h4><div class="source-box">' + esc(f.contact.via) + (contactUrl ? '<p><a href="' + esc(contactUrl) + '" target="_blank" rel="noopener">' + ICON.out + "Open the contact page</a></p>" : "") + "</div></div>" : "") +
      (src ? '<div><h4>Where this came from</h4><div class="source-box"><a href="' + esc(src) + '" target="_blank" rel="noopener">' + ICON.out + esc(f.source.title || src) + "</a><p>" + esc(f.source.seen || "") + "</p></div></div>" : "") +
      '<div><h4>Your notes</h4><textarea class="note" id="note" placeholder="What happened, what to say next time">' + esc(note) + "</textarea></div>" +
      '<div class="hand-note">' + ICON.hand + "<span>Nothing is sent from this page. Copy a draft, make it yours, then send it yourself.</span></div>" +
      "</div>";
    $("#drawer").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#scrim").hidden = false;
    setTimeout(() => { const b = $("#drawer [data-close]"); if (b) b.focus(); }, 50);
  }
  function closeDrawer() {
    openId = null;
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#scrim").hidden = true;
  }

  // Feedback
  let toastTimer = null;
  function toast(html) { const t = $("#toast"); t.innerHTML = html; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400); }
  function burst(x, y) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 16; i++) {
      const el = document.createElement("i");
      el.className = "burst " + (i % 3 ? "clover" : "gold");
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      el.style.left = x + "px"; el.style.top = y + "px";
      el.style.setProperty("--dx", Math.cos(a) * d + "px"); el.style.setProperty("--dy", Math.sin(a) * d - 40 + "px"); el.style.setProperty("--rot", (Math.random() * 360 - 180) + "deg");
      el.style.animation = "burst " + (0.8 + Math.random() * 0.5) + "s cubic-bezier(.2,.7,.3,1) forwards";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  }
  const CHEERS = { moved: "Nice move. Luck favors movement.", replied: "A reply. That is how doors open.", met: "Connected. That is real luck, made by you." };

  function setStatus(id, s, ev) {
    const f = byId.get(id);
    const prev = statusOf(id);
    if (prev === s) s = prev === "passed" ? "open" : prev;
    P.items[id] = Object.assign({}, P.items[id], { status: s, updated: nowIso() });
    P.log.push({ t: nowIso(), id, from: prev, to: s });
    save();
    const gain = (LUCK[s] || 0) > (LUCK[prev] || 0) ? LUCK[s] : 0;
    if (gain) { toast('<span class="coin">+' + gain + "</span>" + esc(CHEERS[s])); const r = ev && ev.target.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2); }
    else if (s === "saved") toast("Saved. It waits in your pipeline.");
    else if (s === "passed") toast("Marked not for me. It will not come back.");
    render(false);
    if (openId && f) drawer(id);
  }
  function togglePlan(key, on, ev) {
    if (on) P.plan[key] = nowIso(); else delete P.plan[key];
    P.log.push({ t: nowIso(), plan: key, to: on ? "done" : "undone" });
    save();
    if (on) { toast('<span class="coin">+1</span>Done. One more step taken.'); const r = ev.target.getBoundingClientRect(); burst(r.left + 11, r.top + 11); }
    render(false);
  }
  function copyText(text, btn) {
    const orig = btn.innerHTML;
    const done = () => { btn.classList.add("copied"); btn.innerHTML = ICON.copy + "Copied"; setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = orig; }, 1600); };
    const fallback = () => { const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch { toast("Select the text and copy it by hand."); } ta.remove(); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify(P, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "progress.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Saved progress.json. Put it in your luck-accelerator folder.");
  }

  // Router and chrome
  const current = () => { const h = location.hash.slice(1); return VIEWS.some((v) => v.key === h) ? h : "overview"; };
  const RENDER = { overview, week, opportunities, pipeline, niches };
  function nav() {
    const v = current();
    const pt = planTotals();
    const counts = { week: pt.total - pt.done, opportunities: finds.filter((f) => statusOf(f.id) === "open").length, pipeline: all.filter((f) => rank(statusOf(f.id)) >= 0).length };
    const html = (short) => VIEWS.map((x) => '<a class="tab" href="#' + x.key + '"' + (x.key === v ? ' aria-current="page"' : "") + ">" + ICON[x.key] + (short ? "<span>" + esc(x.short) + "</span>" : '<span class="tab-long">' + esc(x.label) + '</span><span class="tab-short">' + esc(x.short) + "</span>") + (counts[x.key] ? '<span class="count">' + counts[x.key] + "</span>" : "") + "</a>").join("");
    $(".tabs").innerHTML = html(false);
    $(".tabbar").innerHTML = html(true);
  }
  function render(scroll = true) {
    const y = window.scrollY;
    nav();
    $("#view").innerHTML = '<div class="view">' + RENDER[current()]() + "</div>";
    if (!scroll) { $("#view .view").style.animation = "none"; window.scrollTo(0, y); }
    const q = $("#q"); if (q && F.focusSearch) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); F.focusSearch = false; }
  }
  function footer() {
    const c = cur.checks || {};
    $("#footer").innerHTML = '<div class="left">' + ICON.hand + "<span>Everything here lives in a folder on your computer. Nothing on this page is sent anywhere, and every action is yours to take.</span></div>" +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span>' + esc(c.links || "") + '</span><button class="btn small" data-csv>' + ICON.download + "Export to spreadsheet</button><button class=\"btn small\" data-export>" + ICON.download + "Save progress file</button><span>Template " + esc(D.templateVersion || "") + "</span></div>" +
      '<a class="brandline" href="https://club.reinventing.ai/?utm_source=luck-accelerator&utm_medium=dashboard&utm_campaign=luck-accelerator" target="_blank" rel="noopener"><img src="assets/reinventing-ai.png" alt="" width="22" height="22"><span>Copyright 2026 Mark Fulton - Reinventing.AI Solutions</span></a>';
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    const status = t.closest("[data-status]");
    if (status) { ev.stopPropagation(); setStatus(status.dataset.id, status.dataset.status, ev); return; }
    const copy = t.closest("[data-copy]");
    if (copy) { const f = byId.get(openId); if (f) copyText(f.drafts[copy.dataset.copy], copy); return; }
    if (t.closest("[data-close]") || t.id === "scrim") { closeDrawer(); return; }
    const go = t.closest("[data-go]");
    if (go) { location.hash = go.dataset.go; return; }
    const filter = t.closest("[data-filter]");
    if (filter) { F.cat = filter.dataset.filter; render(false); return; }
    if (t.closest("[data-fresh]")) { F.fresh = !F.fresh; render(false); return; }
    if (t.closest("[data-export]")) { exportProgress(); return; }
    if (t.closest("[data-csv]")) { exportCsv(); return; }
    const weekCal = t.closest("[data-week-ics]");
    if (weekCal) { const h = Number(($("#block-hour") || {}).value || 9); downloadFile("luck-week-" + runDate + ".ics", icsFile(weekEntries(h)), "text/calendar"); toast("Saved your week. Open the file to add it to your calendar."); return; }
    const actBtn = t.closest("[data-act]");
    if (actBtn) {
      const f = byId.get(actBtn.dataset.id);
      if (!f) return;
      const kind = actBtn.dataset.act;
      if (kind === "ics-event") { downloadFile(fileSlug(f.name) + ".ics", icsFile([eventEntry(f)]), "text/calendar"); toast("Saved. Open the file to add it to your calendar."); }
      else if (kind === "ics-follow") { downloadFile("follow-up-" + fileSlug(f.name) + ".ics", icsFile([followUpEntry(f)]), "text/calendar"); toast("Saved a follow up reminder."); }
      else if (kind === "print") printCard(f);
      else if (kind === "copy-open") {
        const d = f.drafts || {};
        const text = f.category === "connections" ? d.first_message : d.intro_post || d.helpful_answer;
        const url = f.category === "connections" ? safeUrl(f.contact && f.contact.url) : safeUrl(f.source.url);
        copyText(text, actBtn);
        if (url) window.open(url, "_blank", "noopener");
        toast("Copied. Paste it, make it yours, then send it yourself.");
      }
      return;
    }
    if (t.closest("#theme-toggle")) { const n = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; store.set(THEME_KEY, n); applyTheme(n); return; }
    if (t.closest(".check") || t.closest("a")) return;
    const open = t.closest("[data-open]");
    if (open) drawer(open.dataset.open);
  });
  document.addEventListener("change", (ev) => {
    const c = ev.target.closest("[data-check]");
    if (c) togglePlan(c.dataset.check, c.checked, ev);
    if (ev.target.id === "sort") { F.sort = ev.target.value; render(false); }
  });
  let noteTimer = null;
  document.addEventListener("input", (ev) => {
    if (ev.target.id === "q") { F.q = ev.target.value; F.focusSearch = true; render(false); }
    if (ev.target.id === "note" && openId) { const id = openId, v = ev.target.value; clearTimeout(noteTimer); noteTimer = setTimeout(() => { P.items[id] = Object.assign({ status: statusOf(id) }, P.items[id], { note: v }); save(); }, 500); }
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && openId) closeDrawer();
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches("[data-open]") && !ev.target.matches("button")) { ev.preventDefault(); drawer(ev.target.dataset.open); }
  });
  const tip = $("#tooltip");
  document.addEventListener("mouseover", (ev) => {
    const n = ev.target.closest("[data-tip]");
    if (!n) { tip.hidden = true; return; }
    const f = byId.get(n.dataset.tip);
    if (!f) return;
    tip.innerHTML = "<b>" + esc(f.name) + "</b>" + esc(catLabel(f.category)) + ", fit " + f.total + " of 10" + (f.isNew ? ", new" : "");
    tip.hidden = false;
  });
  document.addEventListener("mousemove", (ev) => { if (!tip.hidden) { tip.style.left = Math.min(ev.clientX + 14, innerWidth - 270) + "px"; tip.style.top = ev.clientY + 14 + "px"; } });
  window.addEventListener("hashchange", () => { closeDrawer(); render(); window.scrollTo(0, 0); });

  if (cur.theme && typeof cur.theme.hero === "string" && /^[\w./-]+$/.test(cur.theme.hero)) document.documentElement.style.setProperty("--hero-image", 'url("' + cur.theme.hero + '")');
  $("#profile-chip").textContent = [P0.niche, P0.online_only ? "Online" : P0.city].filter(Boolean).join(" · ");
  document.title = "Luck Accelerator · " + (P0.city || P0.niche || "");
  loadProgress().then(() => { render(); footer(); });
  window.LUCK = { data: D, progress: () => P, render };
})();
