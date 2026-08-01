import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBrand, derivePalette } from "../../contexts/BrandContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import api from "../../api/api";
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

const BLANK_THEME = { id: null, name: "", primary: "#10B981", icon: "#10B981", text: "#111827" };

function ThemesManager() {
  const [themes, setThemes] = useState([]);
  const [form, setForm] = useState(BLANK_THEME);
  // Until the admin touches Icon, it tracks Primary — the common case stays one pick.
  const [iconTouched, setIconTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(form.id);

  const load = async () => {
    try {
      const res = await api.get("/themes");
      setThemes(res.data.themes || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(BLANK_THEME);
    setIconTouched(false);
  };

  const setPrimary = (hex) =>
    setForm((f) => ({ ...f, primary: hex, ...(iconTouched ? {} : { icon: hex }) }));

  const startEdit = (t) => {
    setForm({
      id: t._id,
      name: t.name,
      primary: t.primary,
      icon: t.icon || t.primary,
      text: t.text || "#111827",
    });
    // An existing theme's icon is whatever was saved — never re-derive it from primary.
    setIconTouched(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toastr.error("Theme name is required");
    for (const [field, hex] of [["primary", form.primary], ["icon", form.icon], ["text", form.text]]) {
      if (!isValidHex(hex)) return toastr.error(`Enter a valid hex color for ${field}`);
    }
    try {
      setSaving(true);
      // dark + light stay derived from primary; icon and text are picked explicitly.
      const payload = {
        name: form.name.trim(),
        ...derivePalette(form.primary),
        icon: form.icon,
        text: form.text,
      };
      if (editing) {
        await api.put(`/themes/${form.id}`, payload);
        toastr.success("Theme updated");
      } else {
        await api.post("/themes", payload);
        toastr.success("Theme created");
      }
      reset();
      load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this theme? Lessons using it will revert to default.")) return;
    try {
      await api.delete(`/themes/${id}`);
      toastr.success("Theme deleted");
      if (form.id === id) reset();
      load();
    } catch {
      toastr.error("Delete failed");
    }
  };

  return (
    <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-brand-text uppercase tracking-wide">Lesson Themes</h2>
        <p className="text-xs text-brand-muted mt-1">
          Create reusable color palettes. Each lesson can pick a theme — it applies only to that lesson, not the whole site.
        </p>
      </div>

      <div className="border border-brand-border rounded-lg p-4 space-y-4 bg-canvas">
        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
          {editing ? `Editing “${form.name || "theme"}”` : "New Theme"}
        </p>

        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Theme Name</label>
            <input
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
              placeholder="e.g. Ocean Blue"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <ColorField label="Primary" value={form.primary} onChange={setPrimary} hint="Buttons & accents" />
          <ColorField
            label="Icon"
            value={form.icon}
            onChange={(hex) => { setIconTouched(true); setForm((f) => ({ ...f, icon: hex })); }}
            hint="Icons only"
          />
          <ColorField
            label="Text"
            value={form.text}
            onChange={(hex) => setForm((f) => ({ ...f, text: hex }))}
            hint="Body text"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            loading={saving}
            onClick={save}
            leadingIcon={<i className={`fa-solid ${editing ? "fa-check" : "fa-plus"} text-xs`} />}
          >
            {editing ? "Save Changes" : "Add Theme"}
          </Button>
          {editing && <Button variant="ghost" onClick={reset}>Cancel</Button>}
        </div>
      </div>

      {themes.length === 0 ? (
        <p className="text-xs text-brand-muted">No themes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map((t) => (
            <div
              key={t._id}
              className={`flex items-center gap-3 border rounded-lg p-3 ${form.id === t._id ? "border-emerald ring-2 ring-emerald/20" : "border-brand-border"}`}
            >
              <button
                type="button"
                onClick={() => startEdit(t)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left"
                title="Edit this theme"
              >
                <div className="flex gap-1 flex-shrink-0">
                  {[t.primary, t.dark, t.light, t.icon || t.primary, t.text || "#111827"].map((hex, i) => (
                    <span key={i} className="w-5 h-6 rounded border border-brand-border" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text truncate">{t.name}</p>
                  <p className="text-[11px] font-mono text-brand-muted">{t.primary}</p>
                </div>
              </button>
              <button className="text-brand-danger hover:bg-brand-danger/10 w-7 h-7 rounded flex items-center justify-center flex-shrink-0" onClick={() => remove(t._id)} title="Delete">
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      )}
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
      <PageHeader title="Settings" subtitle="Customise the site accent colour and lesson themes" />

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

      {/* Lesson themes library */}
      <ThemesManager />
    </div>
  );
}
