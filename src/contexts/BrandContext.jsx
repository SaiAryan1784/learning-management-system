import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "lms-brand";

const DEFAULTS = {
  primary: "#10B981",
  dark: "#059669",
  light: "#D1FAE5",
};

function hexToRgbComponents(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function hexToRgbHex(hex) {
  return hex;
}

function hexToHsl(hex) {
  const clean = hex.replace("#", "");
  let r = parseInt(clean.slice(0, 2), 16) / 255;
  let g = parseInt(clean.slice(2, 4), 16) / 255;
  let b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function derivePalette(primaryHex) {
  const [h, s, l] = hexToHsl(primaryHex);
  const darkHex = hslToHex(h, Math.min(s + 5, 100), Math.max(l - 15, 10));
  const lightHex = hslToHex(h, Math.max(s - 30, 10), Math.min(l + 40, 95));
  return { primary: primaryHex, dark: darkHex, light: lightHex };
}

function applyToRoot(palette) {
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", hexToRgbComponents(palette.primary));
  root.style.setProperty("--brand-primary-dark", hexToRgbComponents(palette.dark));
  root.style.setProperty("--brand-primary-light", hexToRgbComponents(palette.light));
  // Also update legacy hex vars
  root.style.setProperty("--color-emerald", palette.primary);
  root.style.setProperty("--color-emerald-hover", palette.dark);
  root.style.setProperty("--color-emerald-light", palette.light);
}

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brand, setBrandState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    applyToRoot(brand);
  }, [brand]);

  const setBrand = (primaryHex) => {
    const palette = derivePalette(primaryHex);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
    setBrandState(palette);
  };

  const resetBrand = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBrandState(DEFAULTS);
  };

  return (
    <BrandContext.Provider value={{ brand, setBrand, resetBrand, DEFAULTS }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
