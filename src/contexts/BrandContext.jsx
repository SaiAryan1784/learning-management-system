import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/api";

const STORAGE_KEY = "lms-brand";
const LESSON_THEME_KEY = "lms-lesson-theme";

export const DEFAULTS = {
  primary: "#10B981",
  dark: "#059669",
  light: "#D1FAE5",
  icon: "#10B981",
  text: "#111827",
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

// Every variable applyPaletteToElement can set MUST be listed here — this drives
// clearPaletteFromElement, and a missing entry leaks that colour into the next lesson.
const BRAND_VARS = [
  "--brand-primary",
  "--brand-primary-dark",
  "--brand-primary-light",
  "--brand-icon",
  "--brand-text",
  "--color-emerald",
  "--color-emerald-hover",
  "--color-emerald-light",
  "--color-icon",
  "--color-text",
];

/** Apply a palette's CSS variables to any element (root for global, a container for scoped). */
export function applyPaletteToElement(el, palette) {
  if (!el || !palette?.primary) return;
  // Unset icon/text fall back to primary / the default body colour, so older themes
  // that predate these fields keep rendering exactly as before.
  const icon = palette.icon || palette.primary;
  const text = palette.text || DEFAULTS.text;
  el.style.setProperty("--brand-primary",       hexToRgbComponents(palette.primary));
  el.style.setProperty("--brand-primary-dark",  hexToRgbComponents(palette.dark));
  el.style.setProperty("--brand-primary-light", hexToRgbComponents(palette.light));
  el.style.setProperty("--brand-icon",           hexToRgbComponents(icon));
  el.style.setProperty("--brand-text",           hexToRgbComponents(text));
  el.style.setProperty("--color-emerald",        palette.primary);
  el.style.setProperty("--color-emerald-hover",  palette.dark);
  el.style.setProperty("--color-emerald-light",  palette.light);
  el.style.setProperty("--color-icon",           icon);
  el.style.setProperty("--color-text",           text);
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
 * Pass a theme object ({ primary, dark, light, icon, text }) or null to inherit the
 * global brand. `icon` and `text` are optional.
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
        icon: theme.icon,
        text: theme.text,
      });
    } else {
      clearPaletteFromElement(el);
    }
    return () => clearPaletteFromElement(el);
  }, [theme?.primary, theme?.dark, theme?.light, theme?.icon, theme?.text]);

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

  /**
   * The ONE palette lesson content renders in (Settings → Lesson Theme).
   * Never applied to :root — only handed to `ThemeScope` around lesson
   * content — so it can differ from the site brand without leaking into the
   * app chrome. `null` means "not configured yet"; callers fall back to the
   * brand palette so a fresh org still looks right.
   */
  const [lessonTheme, setLessonThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(LESSON_THEME_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
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
        const lt = res.data?.organization?.lessonTheme;
        if (lt?.primary) {
          localStorage.setItem(LESSON_THEME_KEY, JSON.stringify(lt));
          setLessonThemeState(lt);
        }
      })
      .catch(() => {
        // API failed — silently keep cached/default colors
      });
  }, []);

  /**
   * `extras` carries the colours that are picked rather than derived ({ icon, text }).
   * Omitting it keeps the existing single-argument calls working — icon then tracks the
   * new primary and text keeps whatever was saved.
   */
  const setBrand = async (primaryHex, extras = {}) => {
    const palette = {
      ...derivePalette(primaryHex),
      icon: extras.icon || primaryHex,
      text: extras.text || brand.text || DEFAULTS.text,
    };
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

  /**
   * Saves the org-wide lesson palette. `dark`/`light` are derived from primary
   * exactly as the brand palette is, so the two stay visually consistent.
   */
  const setLessonTheme = async (primaryHex, extras = {}) => {
    const palette = {
      ...derivePalette(primaryHex),
      icon: extras.icon || primaryHex,
      text: extras.text || lessonTheme?.text || DEFAULTS.text,
    };
    localStorage.setItem(LESSON_THEME_KEY, JSON.stringify(palette));
    setLessonThemeState(palette);
    await api.patch("/organization/lesson-theme", palette);
  };

  // Lessons render in the configured palette, or the site brand until one is set.
  const effectiveLessonTheme = lessonTheme?.primary ? lessonTheme : brand;

  return (
    <BrandContext.Provider
      value={{
        brand,
        setBrand,
        resetBrand,
        lessonTheme: effectiveLessonTheme,
        // null until the org has explicitly saved one — lets Settings show
        // "inheriting the brand colour" rather than a misleading saved value.
        lessonThemeConfigured: Boolean(lessonTheme?.primary),
        setLessonTheme,
        DEFAULTS,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
