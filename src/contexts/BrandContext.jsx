import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/api";

const STORAGE_KEY = "lms-brand";

export const DEFAULTS = {
  primary: "#10B981",
  dark: "#059669",
  light: "#D1FAE5",
};

/* ─── colour math ──────────────────────────────────────── */

function hexToRgbComponents(hex) {
  const c = hex.replace("#", "");
  return `${parseInt(c.slice(0,2),16)} ${parseInt(c.slice(2,4),16)} ${parseInt(c.slice(4,6),16)}`;
}

function hexToHsl(hex) {
  const c = hex.replace("#","");
  let r = parseInt(c.slice(0,2),16)/255,
      g = parseInt(c.slice(2,4),16)/255,
      b = parseInt(c.slice(4,6),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){ h=s=0; }
  else{
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      default: h=((r-g)/d+4)/6;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h,s,l){
  h/=360; s/=100; l/=100;
  const hue2rgb=(p,q,t)=>{
    if(t<0)t+=1; if(t>1)t-=1;
    if(t<1/6)return p+(q-p)*6*t;
    if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;
    return p;
  };
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  const hex=x=>Math.round(x*255).toString(16).padStart(2,"0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function derivePalette(primaryHex) {
  const [h,s,l] = hexToHsl(primaryHex);
  return {
    primary: primaryHex,
    dark:  hslToHex(h, Math.min(s+5,100), Math.max(l-15,10)),
    light: hslToHex(h, Math.max(s-30,10), Math.min(l+40,95)),
  };
}

const BRAND_VARS = [
  "--brand-primary",
  "--brand-primary-dark",
  "--brand-primary-light",
  "--color-emerald",
  "--color-emerald-hover",
  "--color-emerald-light",
];

/** Apply a palette's CSS variables to any element (root for global, a container for scoped). */
export function applyPaletteToElement(el, palette) {
  if (!el || !palette?.primary) return;
  el.style.setProperty("--brand-primary",       hexToRgbComponents(palette.primary));
  el.style.setProperty("--brand-primary-dark",  hexToRgbComponents(palette.dark));
  el.style.setProperty("--brand-primary-light", hexToRgbComponents(palette.light));
  el.style.setProperty("--color-emerald",        palette.primary);
  el.style.setProperty("--color-emerald-hover",  palette.dark);
  el.style.setProperty("--color-emerald-light",  palette.light);
}

function clearPaletteFromElement(el) {
  if (!el) return;
  BRAND_VARS.forEach((v) => el.style.removeProperty(v));
}

function applyToRoot(palette) {
  applyPaletteToElement(document.documentElement, palette);
}

/**
 * Scopes a theme palette to its children only (e.g. a single lesson view).
 * The rest of the site keeps the global brand. Variables are removed on unmount.
 * Pass a theme object ({ primary, dark, light }) or null to inherit the global brand.
 */
export function ThemeScope({ theme, className = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (theme?.primary) {
      applyPaletteToElement(el, {
        primary: theme.primary,
        dark: theme.dark || theme.primary,
        light: theme.light || theme.primary,
      });
    } else {
      clearPaletteFromElement(el);
    }
    return () => clearPaletteFromElement(el);
  }, [theme?.primary, theme?.dark, theme?.light]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ─── context ──────────────────────────────────────────── */

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  // Initialise from localStorage cache so colors apply before API responds
  const [brand, setBrandState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // Apply CSS vars whenever brand changes
  useEffect(() => { applyToRoot(brand); }, [brand]);

  // On mount: fetch from backend and sync (supersedes localStorage cache)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return; // Not logged in — keep defaults
    api.get("/organization/settings")
      .then(res => {
        const bs = res.data?.organization?.brandSettings;
        if (bs?.primary) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(bs));
          setBrandState(bs);
        }
      })
      .catch(() => {
        // API failed — silently keep cached/default colors
      });
  }, []);

  const setBrand = async (primaryHex) => {
    const palette = derivePalette(primaryHex);
    // Optimistic update — apply immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
    setBrandState(palette);
    // Persist to backend
    await api.patch("/organization/brand", palette);
  };

  const resetBrand = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setBrandState(DEFAULTS);
    await api.patch("/organization/brand", DEFAULTS);
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
