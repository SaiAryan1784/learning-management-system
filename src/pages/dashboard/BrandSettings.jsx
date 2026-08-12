import { useState } from "react";
import { motion } from "framer-motion";
import { useBrand, derivePalette, ThemeScope } from "../../contexts/BrandContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import toastr from "toastr";

/** Swatch + hex text input pair. Only pushes valid 6-digit hex upward. */
function ColorField({ label, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer flex-shrink-0">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="sr-only" />
          <div
            className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer transition-shadow hover:shadow-soft"
            style={{ backgroundColor: value }}
          />
        </label>
        <input
          type="text"
          value={value}
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2.5 py-2 border border-brand-border rounded-lg text-xs font-mono text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
        />
      </div>
      {hint && <p className="text-[10px] text-brand-muted mt-1">{hint}</p>}
    </div>
  );
}

/**
 * The organization's ONE lesson palette.
 *
 * Replaces the old named-theme library + per-lesson picker: there is a single
 * palette, it lives here, and every lesson renders in it. The right-hand panel
 * is a real `ThemeScope` around real lesson chrome, so what an admin sees here
 * is exactly what a learner gets — the same reason the brand panel above has a
 * live preview rather than bare swatches.
 */
function LessonThemePanel() {
  const { brand, lessonTheme, lessonThemeConfigured, setLessonTheme, DEFAULTS } = useBrand();
  const [primary, setPrimary] = useState(lessonTheme.primary);
  const [iconColor, setIconColor] = useState(lessonTheme.icon || lessonTheme.primary);
  const [textColor, setTextColor] = useState(lessonTheme.text || DEFAULTS.text);
  // Icon tracks Primary until an admin picks one explicitly — same rule the
  // brand panel uses, so the common case stays a single decision.
  const [iconTouched, setIconTouched] = useState(
    Boolean(lessonTheme.icon && lessonTheme.icon !== lessonTheme.primary),
  );
  const [saving, setSaving] = useState(false);

  // The palette the preview renders in — derived from the in-progress picks,
  // not from what's saved, so the preview reacts as colours are chosen.
  const draft = { ...derivePalette(primary), icon: iconColor, text: textColor };

  const applyPrimary = (hex) => {
    setPrimary(hex);
    if (!iconTouched) setIconColor(hex);
  };

  const handleSave = async () => {
    for (const [field, hex] of [["primary", primary], ["icon", iconColor], ["text", textColor]]) {
      if (!isValidHex(hex)) return toastr.error(`Enter a valid hex color for ${field}`);
    }
    try {
      setSaving(true);
      await setLessonTheme(primary, { icon: iconColor, text: textColor });
      toastr.success("Lesson theme saved — all lessons updated");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Failed to save lesson theme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* ── Controls ── */}
      <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-brand-text uppercase tracking-wide">
            Lesson Theme
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            One palette for every lesson in your organization. It applies to lesson content
            only — the rest of the site keeps the brand colour above.
            {!lessonThemeConfigured && " Not set yet — lessons currently use your brand colour."}
          </p>
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          <ColorField label="Primary" value={primary} onChange={applyPrimary} hint="Buttons & accents" />
          <ColorField
            label="Icon"
            value={iconColor}
            onChange={(hex) => { setIconTouched(true); setIconColor(hex); }}
            hint="Icons only"
          />
          <ColorField label="Text" value={textColor} onChange={setTextColor} hint="Body text" />
        </div>

        <div>
          <p className="text-xs text-brand-muted mb-3 uppercase tracking-wide font-semibold">Presets</p>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((p) => (
              <motion.button
                key={p.hex}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                title={p.name}
                onClick={() => applyPrimary(p.hex)}
                className="relative w-9 h-9 rounded-full border-2 transition-shadow"
                style={{
                  backgroundColor: p.hex,
                  borderColor: primary === p.hex ? p.hex : "transparent",
                  boxShadow: primary === p.hex ? `0 0 0 3px ${p.hex}40` : "none",
                }}
              >
                {primary === p.hex && (
                  <i className="fa-solid fa-check text-white text-[10px] absolute inset-0 flex items-center justify-center" style={{ display: "flex" }} />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save Lesson Theme
          </Button>
          {/* The common case by far: an org wants lesson content to look like
              the rest of their site. One click beats hunting for their hex. */}
          <Button
            variant="secondary"
            onClick={() => {
              setPrimary(brand.primary);
              setIconColor(brand.icon || brand.primary);
              setTextColor(brand.text || DEFAULTS.text);
              setIconTouched(true);
            }}
          >
            Match brand colour
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPrimary(DEFAULTS.primary);
              setIconColor(DEFAULTS.icon);
              setTextColor(DEFAULTS.text);
              setIconTouched(false);
            }}
          >
            Reset to Default
          </Button>
        </div>
      </div>

      {/* ── Live lesson preview ── */}
      <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-brand-text uppercase tracking-wide">
          Lesson Preview
        </h2>
        <p className="text-xs text-brand-muted">
          A real lesson rendered in the palette above. Changes apply to every lesson on save.
        </p>

        {/* ThemeScope sets the same CSS variables a learner's lesson gets, so
            these are the real components, not a mock-up of them. */}
        <ThemeScope theme={draft} className="border border-brand-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-book-open text-icon"></i>
            <span className="text-[10px] font-bold uppercase tracking-wider text-icon">Guide</span>
          </div>

          <h3 className="text-lg font-bold text-brand-text">Mission, Vision &amp; Values</h3>
          <p className="text-sm text-brand-text/80">
            Body copy uses the text colour. Headings, paragraphs and lists inside a lesson all
            follow it.
          </p>

          <div className="rounded-lg border-l-4 border-emerald bg-emerald-muted/40 p-4">
            <p className="text-sm text-brand-text">
              Callout blocks pick up the primary colour on their bar and background.
            </p>
          </div>

          <div className="border border-brand-border rounded-xl overflow-hidden">
            <div className="w-full flex items-center justify-between px-4 py-3 bg-canvas">
              <span className="text-sm font-semibold text-brand-text">Accordion section</span>
              <i className="fa-solid fa-chevron-down text-xs text-brand-muted"></i>
            </div>
          </div>

          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border cursor-pointer">
            <input type="radio" readOnly checked className="accent-emerald" />
            <span className="text-sm text-brand-text">A knowledge-check answer</span>
          </label>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-brand-border">
            <span className="text-xs text-brand-muted">Page 2 of 5</span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald">
              Complete &amp; Next
              <i className="fa-solid fa-check text-xs" />
            </span>
          </div>
        </ThemeScope>
      </div>
    </div>
  );
}


const PRESETS = [
  { name: "Emerald",  hex: "#10B981" },
  { name: "Sky",      hex: "#0EA5E9" },
  { name: "Violet",   hex: "#8B5CF6" },
  { name: "Rose",     hex: "#F43F5E" },
  { name: "Amber",    hex: "#F59E0B" },
  { name: "Cyan",     hex: "#06B6D4" },
  { name: "Indigo",   hex: "#6366F1" },
  { name: "Orange",   hex: "#F97316" },
];

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export default function BrandSettings() {
  const { brand, setBrand, resetBrand, DEFAULTS } = useBrand();
  const [pickerColor, setPickerColor] = useState(brand.primary);
  const [hexInput, setHexInput] = useState(brand.primary);
  const [preview, setPreview] = useState(brand.primary);
  const [iconColor, setIconColor] = useState(brand.icon || brand.primary);
  const [textColor, setTextColor] = useState(brand.text || DEFAULTS.text);
  // Icon follows Primary until the admin picks one explicitly.
  const [iconTouched, setIconTouched] = useState(Boolean(brand.icon && brand.icon !== brand.primary));

  const applyPrimary = (hex) => {
    setPickerColor(hex);
    setHexInput(hex);
    setPreview(hex);
    if (!iconTouched) setIconColor(hex);
  };

  const handlePreset = (hex) => applyPrimary(hex);

  const handlePickerChange = (e) => applyPrimary(e.target.value);

  const handleHexInput = (e) => {
    const val = e.target.value;
    setHexInput(val);
    if (isValidHex(val)) applyPrimary(val);
  };

  const handleSave = () => {
    for (const [field, hex] of [["primary", pickerColor], ["icon", iconColor], ["text", textColor]]) {
      if (!isValidHex(hex)) {
        toastr.error(`Enter a valid hex color for ${field}`);
        return;
      }
    }
    setBrand(pickerColor, { icon: iconColor, text: textColor });
    toastr.success("Brand colors saved — site updated!");
  };

  const handleReset = () => {
    resetBrand();
    setPickerColor(DEFAULTS.primary);
    setHexInput(DEFAULTS.primary);
    setPreview(DEFAULTS.primary);
    setIconColor(DEFAULTS.icon);
    setTextColor(DEFAULTS.text);
    setIconTouched(false);
    toastr.info("Brand colors reset to default");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Customise the site accent colour and the lesson theme" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Colour picker panel ── */}
        <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-6">
          <h2 className="text-sm font-semibold text-brand-text uppercase tracking-wide">
            Primary Brand Colour
          </h2>

          {/* Preset swatches */}
          <div>
            <p className="text-xs text-brand-muted mb-3 uppercase tracking-wide font-semibold">Presets</p>
            <div className="flex flex-wrap gap-3">
              {PRESETS.map((p) => (
                <motion.button
                  key={p.hex}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  title={p.name}
                  onClick={() => handlePreset(p.hex)}
                  className="relative w-9 h-9 rounded-full border-2 transition-shadow"
                  style={{
                    backgroundColor: p.hex,
                    borderColor: preview === p.hex ? p.hex : "transparent",
                    boxShadow: preview === p.hex ? `0 0 0 3px ${p.hex}40` : "none",
                  }}
                >
                  {preview === p.hex && (
                    <i className="fa-solid fa-check text-white text-[10px] absolute inset-0 flex items-center justify-center" style={{ display: "flex" }} />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom picker */}
          <div>
            <p className="text-xs text-brand-muted mb-3 uppercase tracking-wide font-semibold">Custom Colour</p>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={pickerColor}
                  onChange={handlePickerChange}
                  className="sr-only"
                />
                <div
                  className="w-11 h-11 rounded-xl border-2 border-brand-border shadow-soft cursor-pointer transition-shadow hover:shadow-elevated"
                  style={{ backgroundColor: pickerColor }}
                />
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  value={hexInput}
                  onChange={handleHexInput}
                  maxLength={7}
                  placeholder="#10B981"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-mono text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
                />
                {hexInput.length > 1 && !isValidHex(hexInput) && (
                  <p className="text-xs text-brand-danger mt-1">Enter a valid 6-digit hex e.g. #10B981</p>
                )}
              </div>
            </div>
          </div>

          {/* Icon + text — picked explicitly, never derived from primary */}
          <div>
            <p className="text-xs text-brand-muted mb-3 uppercase tracking-wide font-semibold">Icon &amp; Text</p>
            <div className="flex items-start gap-4 flex-wrap">
              <ColorField
                label="Icon"
                value={iconColor}
                onChange={(hex) => { setIconTouched(true); setIconColor(hex); }}
                hint="Icons only"
              />
              <ColorField label="Text" value={textColor} onChange={setTextColor} hint="Body text" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
            <Button variant="primary" onClick={handleSave}>
              Save Brand Colours
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Reset to Default
            </Button>
          </div>
        </div>

        {/* ── Live preview panel ── */}
        <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text uppercase tracking-wide">
            Live Preview
          </h2>
          <p className="text-xs text-brand-muted">
            Shows how the selected colour looks across key UI elements. Changes apply site-wide on save.
          </p>

          <div className="space-y-4">
            {/* Button preview */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Buttons</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: preview }}
                >
                  <i className="fa-solid fa-plus text-xs" />
                  Primary Button
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors bg-transparent"
                  style={{ borderColor: preview, color: preview }}
                >
                  Outline Button
                </button>
              </div>
            </div>

            {/* Active nav pill */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Active Nav Item</p>
              <div className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: preview }}>
                <i className="fa-solid fa-house text-sm" />
                Dashboard
              </div>
            </div>

            {/* Badge */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Status Badge</p>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${preview}1a`, color: preview }}
              >
                Published
              </span>
            </div>

            {/* Focus ring */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Focus Ring</p>
              <input
                readOnly
                value="Focused input field"
                className="px-3 py-2 border-2 rounded-lg text-sm w-full outline-none"
                style={{ borderColor: preview, boxShadow: `0 0 0 3px ${preview}30` }}
              />
            </div>

            {/* Link / accent text */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Accent Text</p>
              <span className="text-sm font-semibold" style={{ color: preview }}>
                View all courses →
              </span>
            </div>

            {/* Icons */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Icons</p>
              <div className="flex items-center gap-4 text-lg" style={{ color: iconColor }}>
                <i className="fa-solid fa-graduation-cap" />
                <i className="fa-solid fa-file-pdf" />
                <i className="fa-solid fa-award" />
                <i className="fa-solid fa-chart-simple" />
              </div>
            </div>

            {/* Body text */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">Body Text</p>
              <p className="text-sm" style={{ color: textColor }}>
                Headings and paragraph copy use this colour.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current saved palette info */}
      <div className="bg-surface border border-brand-border rounded-xl p-5">
        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-3">Current Saved Palette</p>
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { label: "Primary", value: brand.primary },
            { label: "Dark / Hover", value: brand.dark },
            { label: "Light", value: brand.light },
            { label: "Icon", value: brand.icon || brand.primary },
            { label: "Text", value: brand.text || DEFAULTS.text },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border border-brand-border" style={{ backgroundColor: value }} />
              <div>
                <p className="text-[10px] text-brand-muted uppercase tracking-wide">{label}</p>
                <p className="text-xs font-mono text-brand-text">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The single org-wide lesson palette */}
      <LessonThemePanel />
    </div>
  );
}
