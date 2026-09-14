#!/usr/bin/env node
/**
 * Dangling-action check.
 *
 * Every in-page navigation (navigate("..."), <Link to="...">) must lead to a
 * route the viewer can enter. For each occurrence this script finds the target
 * route's permission (from App.jsx) and the source page's own route
 * permission, then asks: for every real role preset that can reach the source
 * page, can it also enter the target? If not, the source file must gate the
 * action on the target's permission — otherwise it is reported.
 *
 * This is the class of bug behind both client reports in Sept 2026: the
 * sidebar and router agreed (09-11) while buttons inside pages still bounced
 * Franchise Owners off the route guard (09-14).
 *
 * Runs as `prebuild`, so a dangling action fails the Vercel deploy.
 *
 * Usage: npm run check:access
 *   scripts/role-presets.json is a snapshot of backend rolePresets.ts —
 *   regenerate it after any preset change:
 *   (backend) npm run dump:presets > ../../learning-management-system/scripts/role-presets.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const presetsFile = process.argv[2];
if (!presetsFile) {
  console.error("usage: node scripts/check-access.mjs <presets.json>");
  process.exit(2);
}
const presets = JSON.parse(fs.readFileSync(presetsFile, "utf8"));
const access = await import(path.join(root, "src/auth/access.js"));
const { PERM, COURSE_ADMIN, AUTHORING, can } = access;

// ---- 1. Route table from App.jsx -------------------------------------------
const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
const routes = [];
const routeRe = /<Route\s+path="([^"]+)"\s+element=\{<Guard(?:\s+permission=\{([^}]+)\})?>/g;
for (const m of app.matchAll(routeRe)) {
  const [, p, expr] = m;
  const full = p.startsWith("/") ? p : `/dashboard/${p}`;
  routes.push({ path: full, permission: expr ? evalPerm(expr) : null, expr: expr || "null" });
}
function evalPerm(expr) {
  const t = expr.trim();
  if (t === "COURSE_ADMIN") return COURSE_ADMIN;
  if (t === "AUTHORING") return AUTHORING;
  const m = t.match(/^PERM\.(\w+)$/);
  if (m && m[1] in PERM) return PERM[m[1]];
  throw new Error(`unknown permission expression in App.jsx: ${expr}`);
}
const toRegex = (p) =>
  new RegExp(
    "^" +
      p
        .replace(/\/:\w+\?/g, "(?:/[^/]+)?")
        .replace(/:\w+/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$",
  );
routes.forEach((r) => (r.re = toRegex(r.path)));
const findRoute = (target) => routes.find((r) => r.re.test(target));

// ---- 2. Navigation targets in every page/component ------------------------
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (f.endsWith(".jsx")) files.push(f);
  }
})(path.join(root, "src"));

// A template literal's ${...} becomes a single path segment wildcard.
const literal = (s) => s.replace(/\$\{[^}]*\}/g, "X");
const navRe = /navigate\(\s*(?:"([^"]+)"|`([^`]+)`)/g;
const linkRe = /\bto=(?:"([^"]+)"|\{`([^`]+)`\})/g;

// Which route renders this file? (lazy import name → route element)
const lazyRe = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("\.\/(.+?)"\)\)/g;
const elementByFile = new Map();
for (const m of app.matchAll(lazyRe)) elementByFile.set(path.join(root, "src", m[2] + ".jsx"), m[1]);
const sourcePermission = (file) => {
  const el = elementByFile.get(file);
  if (!el) return undefined; // component, not a routed page
  const m = app.match(new RegExp(`<Route\\s+path="([^"]+)"\\s+element=\\{<Guard(?:\\s+permission=\\{([^}]+)\\})?><${el}\\s*/>`));
  if (!m) return undefined;
  return m[2] ? evalPerm(m[2]) : null;
};

const hp = (preset) => (perm) => preset.permissions.includes("*") || preset.permissions.includes(perm);
const gateNames = (perm) => {
  // The names a file could use to gate on this permission.
  const names = [];
  for (const [k, v] of Object.entries(PERM)) if (v === perm) names.push(`PERM.${k}`);
  if (perm === AUTHORING) names.push("AUTHORING");
  if (perm === COURSE_ADMIN) names.push("COURSE_ADMIN");
  if (typeof perm === "string") names.push(`"${perm}"`);
  // An any-of array is satisfied by gating on any one of its members.
  if (Array.isArray(perm)) for (const member of perm) names.push(...gateNames(member));
  return names;
};

let problems = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  const srcPerm = sourcePermission(file);
  const targets = [];
  for (const m of src.matchAll(navRe)) targets.push({ raw: m[1] ?? m[2], line: lineOf(src, m.index) });
  for (const m of linkRe[Symbol.matchAll] ? src.matchAll(linkRe) : []) targets.push({ raw: m[1] ?? m[2], line: lineOf(src, m.index) });

  for (const t of targets) {
    const target = literal(t.raw).split("?")[0];
    if (!target.startsWith("/dashboard")) continue;
    const route = findRoute(target);
    if (!route) continue; // Navigate to /login etc.
    if (route.permission === null) continue; // anyone may enter

    // Roles that reach the source page but cannot enter the target.
    const reachSource = srcPerm === undefined
      ? presets // a shared component: assume every role may render it
      : presets.filter((p) => can(hp(p), srcPerm));
    const blocked = reachSource.filter((p) => !can(hp(p), route.permission));
    if (blocked.length === 0) continue;

    // The file must then gate this action on the target's permission.
    const names = gateNames(route.permission);
    const gated = names.some((n) => src.includes(n));
    if (gated) continue;

    problems++;
    console.log(
      `${rel}:${t.line}  → ${t.raw}\n    route ${route.path} needs ${route.expr}; reachable by ${blocked.map((p) => p.name).join(", ")} who cannot enter it; no gate on ${names.join(" / ")}`,
    );
  }
}
function lineOf(src, idx) {
  return src.slice(0, idx).split("\n").length;
}

if (problems) {
  console.log(`\n${problems} dangling action(s).`);
  process.exit(1);
}
console.log(`ok — ${routes.length} routes, ${files.length} files, no dangling actions for ${presets.map((p) => p.name).join(", ")}`);
