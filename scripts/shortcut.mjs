#!/usr/bin/env node
// Puts a "Luck Dashboard" shortcut on the person's desktop. Opening it starts the dashboard on this
// computer (dashboard/serve.mjs --open) and shows it in the browser; if it is already running for
// that folder, it just opens the browser.
//   node shortcut.mjs <luck-accelerator folder>            create or refresh the shortcut
//   node shortcut.mjs <luck-accelerator folder> --remove   take it off the desktop
//   node shortcut.mjs <luck-accelerator folder> --dry      print what it would write
//   node shortcut.mjs --selftest
// Windows: a .lnk made with the system's own WScript.Shell, on the real desktop (OneDrive aware).
// macOS: an executable "Luck Dashboard.command" on ~/Desktop. Linux: a .desktop launcher.
// It writes nothing else outside the folder and sends nothing anywhere. No dependencies.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "Luck Dashboard";

function desktopDir() {
  if (process.platform === "win32") {
    // The registered desktop, which OneDrive often moves away from %USERPROFILE%\Desktop.
    const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "[Environment]::GetFolderPath('Desktop')"], { encoding: "utf8" });
    const dir = (r.stdout || "").trim();
    if (dir && fs.existsSync(dir)) return dir;
  }
  if (process.platform === "linux") {
    const r = spawnSync("xdg-user-dir", ["DESKTOP"], { encoding: "utf8" });
    const dir = (r.stdout || "").trim();
    if (dir && fs.existsSync(dir)) return dir;
  }
  return path.join(os.homedir(), "Desktop");
}

export function plan(folder, platform = process.platform, desktop = null, node = process.execPath) {
  const root = path.resolve(folder);
  const dash = path.join(root, "dashboard");
  const serve = path.join(dash, "serve.mjs");
  const desk = desktop || desktopDir();
  if (platform === "win32") {
    return { platform, file: path.join(desk, NAME + ".lnk"), target: node, args: '"' + serve + '" --open', cwd: dash, icon: path.join(dash, "assets", "icon.ico") };
  }
  if (platform === "darwin") {
    const q = (s) => "'" + s.replace(/'/g, "'\\''") + "'";
    return { platform, file: path.join(desk, NAME + ".command"), body: "#!/bin/bash\n# Opens your Luck Accelerator dashboard. Close this window to stop it.\ncd " + q(dash) + "\nexec " + q(node) + " " + q(serve) + " --open\n" };
  }
  const e = (s) => '"' + s.replace(/(["`$\\])/g, "\\$1") + '"';
  return { platform, file: path.join(desk, "luck-dashboard.desktop"), body: "[Desktop Entry]\nType=Application\nName=" + NAME + "\nComment=Open your Luck Accelerator dashboard\nExec=" + e(node) + " " + e(serve) + " --open\nPath=" + dash + "\nIcon=" + path.join(dash, "assets", "icon.png") + "\nTerminal=false\n" };
}

function writeLnk(p) {
  // Values travel as environment variables, so no path is ever pasted into PowerShell source.
  const ps = "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:LA_FILE);$s.TargetPath=$env:LA_TARGET;$s.Arguments=$env:LA_ARGS;$s.WorkingDirectory=$env:LA_CWD;$s.WindowStyle=7;$s.Description='Open your Luck Accelerator dashboard';if(Test-Path $env:LA_ICON){$s.IconLocation=$env:LA_ICON+',0'};$s.Save()";
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", env: { ...process.env, LA_FILE: p.file, LA_TARGET: p.target, LA_ARGS: p.args, LA_CWD: p.cwd, LA_ICON: p.icon } });
  if (r.status !== 0) throw new Error((r.stderr || "PowerShell could not make the shortcut").trim());
}

function selftest() {
  const fails = [];
  const ok = (n, c) => { if (!c) fails.push(n); };
  const w = plan("C:\\Users\\a b\\luck-accelerator", "win32", "C:\\Users\\a b\\OneDrive\\Desktop", "C:\\node\\node.exe");
  ok("win file", w.file === path.join("C:\\Users\\a b\\OneDrive\\Desktop", "Luck Dashboard.lnk"));
  ok("win args quoted", w.args.startsWith('"') && w.args.endsWith('" --open') && w.args.includes("serve.mjs"));
  ok("win icon", w.icon.endsWith(path.join("assets", "icon.ico")));
  const m = plan("/Users/o'neil/luck-accelerator", "darwin", "/Users/o'neil/Desktop", "/usr/local/bin/node");
  ok("mac file", m.file.endsWith("Luck Dashboard.command"));
  ok("mac quoting", m.body.includes("'/usr/local/bin/node'") && m.body.includes("o'\\''neil") && m.body.endsWith("--open\n"));
  const l = plan("/home/a/luck-accelerator", "linux", "/home/a/Desktop", "/usr/bin/node");
  ok("linux file", l.file.endsWith("luck-dashboard.desktop") && l.body.includes("Exec=\"/usr/bin/node\"") && l.body.includes("Terminal=false"));
  if (fails.length) { process.stdout.write("shortcut selftest: FAIL\n  " + fails.join("\n  ") + "\n"); process.exit(1); }
  process.stdout.write("shortcut selftest: PASS\n");
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) selftest();
else {
  const folder = args.find((a) => !a.startsWith("--"));
  if (!folder || !fs.existsSync(path.join(folder, "dashboard", "serve.mjs"))) { process.stderr.write("shortcut: pass the luck-accelerator folder (it needs dashboard/serve.mjs; run build.mjs first)\n"); process.exit(1); }
  const p = plan(folder);
  if (args.includes("--dry")) { process.stdout.write(JSON.stringify(p, null, 2) + "\n"); process.exit(0); }
  if (args.includes("--remove")) {
    if (fs.existsSync(p.file)) fs.rmSync(p.file);
    process.stdout.write("Removed " + p.file + "\n");
    process.exit(0);
  }
  if (p.platform === "win32") writeLnk(p);
  else fs.writeFileSync(p.file, p.body, { mode: 0o755 });
  process.stdout.write("Desktop shortcut: " + p.file + "\n");
}
