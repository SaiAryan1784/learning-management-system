/**
 * Copies pdf.js's character maps and standard font data out of node_modules and
 * into public/ so the PDF viewer can fetch them at runtime.
 *
 * Without these, pdf.js substitutes system fonts for any PDF that references one
 * of the 14 standard fonts without embedding it (common in Word exports) and
 * cannot decode CJK / non-Latin text at all.
 *
 * They live in directories, which Vite's `?url` asset handling cannot address,
 * so this runs as a prestep to `dev` and `build`. Output is gitignored — it is
 * regenerated from whatever pdfjs-dist version is installed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "node_modules", "pdfjs-dist");
const to = path.join(root, "public", "pdfjs");

if (!fs.existsSync(from)) {
  console.error("[pdfjs] node_modules/pdfjs-dist not found — run npm install first.");
  process.exit(1);
}

for (const dir of ["cmaps", "standard_fonts"]) {
  const src = path.join(from, dir);
  if (!fs.existsSync(src)) {
    console.error(`[pdfjs] missing ${dir}/ in pdfjs-dist — check the installed version.`);
    process.exit(1);
  }
  fs.rmSync(path.join(to, dir), { recursive: true, force: true });
  fs.cpSync(src, path.join(to, dir), { recursive: true });
}

console.log("[pdfjs] copied cmaps + standard_fonts to public/pdfjs/");
