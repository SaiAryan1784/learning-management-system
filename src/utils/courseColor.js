// Brand-only course accent colors.
//
// Course cards used to cycle an arbitrary 8-colour array (purple, red, teal…). Per the
// client, the accent stripe must stay within the org's brand. We read the brand primary
// from the `--brand-primary` CSS var (set per-org by BrandContext) and derive a small
// palette of brand shades by stepping lightness while keeping the brand hue/saturation.
// Selection is deterministic (hash of the course title), so colours never change on re-render.

const FALLBACK_HSL = { h: 160, s: 84, l: 39 }; // emerald #10B981

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function readBrandHsl() {
  if (typeof window === "undefined" || typeof document === "undefined") return FALLBACK_HSL;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--brand-primary")
    .trim();
  const parts = raw.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
  if (parts.length < 3) return FALLBACK_HSL;
  return rgbToHsl(parts[0], parts[1], parts[2]);
}

// Lightness steps kept dark enough that white text stays legible on the avatar chip.
const LIGHTNESS_STEPS = [38, 44, 31, 48, 35, 41];

export function getCourseColor(title = "") {
  const { h, s } = readBrandHsl();
  const sat = Math.max(45, s); // keep colours saturated even for muted brand primaries
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % LIGHTNESS_STEPS.length;
  return hslToHex(h, sat, LIGHTNESS_STEPS[idx]);
}
