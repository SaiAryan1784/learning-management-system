import { useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import {
  DndContext, pointerWithin, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, useDraggable, useDroppable, DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../components/lesson/lessonContent.css";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { ThemeScope } from "../../contexts/BrandContext";
import FilePreview from "../../components/lesson/FilePreview";
import NumberScale from "../../components/lesson/NumberScale";
import SignaturePad from "../../components/lesson/SignaturePad";
import FlipCard from "../../components/lesson/FlipCard";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const BASE_URL = api.defaults.baseURL || "";
// VITE_FILE_BASE_URL is set explicitly in .env.production so uploads always resolve
// to the real server — not localhost — regardless of how the build was run.
const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL || BASE_URL.replace(/\/api$/, "");

const fileUrl = (config) => {
  if (!config) return "";
  if (config.contentUrl) return config.contentUrl.startsWith("http") ? config.contentUrl : `${FILE_BASE_URL}${config.contentUrl}`;
  if (config.storageKey) return `${FILE_BASE_URL}/uploads/${config.storageKey}`;
  return "";
};

const youtubeEmbed = (url) => {
  if (!url) return "";
  if (url.includes("youtube.com/watch")) return `https://www.youtube.com/embed/${url.split("v=")[1]?.split("&")[0]}`;
  if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]?.split("?")[0]}`;
  return url;
};

// Field catalog
const CONTENT_FIELDS = [
  { kind: "text", label: "Text", icon: "fa-align-left" },
  { kind: "callout", label: "Callout", icon: "fa-bullhorn" },
  { kind: "image", label: "Image", icon: "fa-image" },
  { kind: "video_link", label: "Video Link", icon: "fa-video" },
  { kind: "attach_file", label: "Attach File (PDF)", icon: "fa-file-pdf" },
  { kind: "divider", label: "Divider", icon: "fa-grip-lines" },
  { kind: "flip_card", label: "Flip Card", icon: "fa-clone" },
  { kind: "accordion", label: "Accordion", icon: "fa-bars-staggered" },
];
const KC_FIELDS = [
  { kind: "text_answer", label: "Text Answer", icon: "fa-keyboard" },
  { kind: "mcq", label: "MCQ", icon: "fa-list-check" },
  { kind: "survey", label: "Survey (1-5)", icon: "fa-star-half-stroke" },
  { kind: "matching", label: "Matching", icon: "fa-arrows-left-right" },
  { kind: "file_upload", label: "File Upload", icon: "fa-cloud-arrow-up" },
  { kind: "esignature", label: "E-Signature", icon: "fa-signature" },
];
const FIELD_META = Object.fromEntries([...CONTENT_FIELDS, ...KC_FIELDS].map((f) => [f.kind, f]));
const CONTENT_KINDS = CONTENT_FIELDS.map((f) => f.kind);
const GRADABLE = ["mcq", "matching"];

const TYPE_OPTIONS = [
  { value: "resource", label: "Resource", desc: "Content only — reading or watching material to review.", icon: "fa-book-open" },
  { value: "guide", label: "Guide", desc: "Content plus knowledge checks mixed together.", icon: "fa-chalkboard-user" },
  { value: "quiz", label: "Quiz", desc: "Knowledge checks only — scored with a pass mark.", icon: "fa-clipboard-question" },
];

const STEPS = ["Details", "Build"];

function categoryFor(kind) {
  return CONTENT_KINDS.includes(kind) ? "content" : "knowledge_check";
}

function defaultConfig(kind) {
  switch (kind) {
    case "text":
    case "callout": return { html: "" };
    case "accordion": return { title: "", body: "" };
    case "flip_card": return { front: "", back: "" };
    case "divider": return { thickness: 2, style: "solid" };
    case "video_link": return { sourceType: "external_url", contentUrl: "" };
    case "image":
    case "attach_file": return { sourceType: "stored_file" };
    case "text_answer": return { prompt: "" };
    case "mcq": return { prompt: "", multiple: false, options: [{ key: "A", text: "" }, { key: "B", text: "" }] };
    case "survey": return { prompt: "", scaleMax: 5 };
    case "matching": return { pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
    case "file_upload": return { prompt: "" };
    case "esignature": return { label: "Sign here" };
    default: return {};
  }
}

const fieldInputClass =
  "w-full px-3.5 py-2.5 border border-brand-border rounded-lg text-base text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";
const optionInputClass =
  "flex-1 px-3.5 py-2.5 border border-brand-border rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-emerald";

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={[
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-colors",
                done ? "bg-emerald border-emerald text-white" :
                active ? "border-emerald text-emerald bg-emerald/10" :
                "border-brand-border text-brand-muted",
              ].join(" ")}>
                {done ? <i className="fa-solid fa-check text-[10px]" /> : n}
              </div>
              <span className={`text-xs font-semibold hidden sm:block whitespace-nowrap ${active ? "text-brand-text" : "text-brand-muted"}`}>
                {label}
              </span>
            </div>
            {n < STEPS.length && (
              <div className={`flex-1 h-px mx-3 transition-colors ${done ? "bg-emerald" : "bg-brand-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Bounded YouTube/embed preview (external URL, not an uploaded file → FilePreview
// doesn't apply). YouTube allows cross-origin framing, so no header issues here.
function YouTubePreview({ url, height = 220 }) {
  const src = youtubeEmbed(url);
  if (!src) return null;
  return (
    <div className="mx-auto rounded-lg border border-brand-border bg-black overflow-hidden" style={{ aspectRatio: "16 / 9", width: Math.round((height * 16) / 9), maxWidth: "100%" }}>
      <iframe
        src={src}
        title="Video preview"
        allowFullScreen
        className="block w-full h-full"
      />
    </div>
  );
}

// Lesson appearance selector. Visual rebuild per the client reference — a "Guide Primary"
// readout, Navigation/Content tabs, and a vertical list of full-width theme rows. The data
// model is unchanged: rows are the org's themes and selecting one saves the per-lesson
// `themeId`. "Default" clears the theme. (Navigation vs Content is presentational; both map
// to the single per-lesson palette the model supports.)
function ThemeSelector({ themes, themeId, setThemeId }) {
  const [tab, setTab] = useState("navigation");
  const selected = themes.find((t) => t._id === themeId) || null;
  const primary = selected?.primary || "#10B981";
  const rows = [{ _id: "", name: "Default", primary: "#6B7280" }, ...themes];

  return (
    <div className="bg-surface border border-brand-border rounded-xl p-5 space-y-4">
      {/* Guide Primary */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Guide Primary</label>
        <span
          className="w-9 h-9 rounded-lg border border-brand-border flex-shrink-0"
          style={{ backgroundColor: primary }}
        />
        <input
          readOnly
          value={primary.toUpperCase()}
          className="w-28 px-3 py-2 border border-brand-border rounded-lg text-sm font-mono text-brand-text bg-canvas"
        />
      </div>

      {/* Navigation / Content tabs */}
      <div>
        <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
          {[
            { v: "navigation", label: "Navigation Theme" },
            { v: "content", label: "Content Theme" },
          ].map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === t.v ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-brand-muted mt-2">
          {tab === "navigation"
            ? "Applies to the left-side navigation panel."
            : "Applies to the lesson content area."}
        </p>
      </div>

      {/* Theme rows */}
      <div className="space-y-2">
        {rows.map((t) => {
          const active = (themeId || "") === (t._id || "");
          return (
            <button
              key={t._id || "default"}
              type="button"
              onClick={() => setThemeId(t._id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-bold uppercase tracking-wide transition-all"
              style={
                active
                  ? { backgroundColor: "#1F2937", color: "#fff", borderColor: "#1F2937" }
                  : { backgroundColor: t.primary, color: "#fff", borderColor: "transparent" }
              }
            >
              <span className="truncate">{t.name}</span>
              {active && <i className="fa-solid fa-check flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Interactive preview-tab field components (real state, so the preview responds) ── */

function PreviewSurvey({ config }) {
  const [value, setValue] = useState(0);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-text">{config.prompt || "Survey question"}</p>
      <NumberScale value={value} scaleMax={config.scaleMax || 5} onChange={setValue} />
    </div>
  );
}

function PreviewTextAnswer({ config }) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
      <textarea
        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
        rows={3}
        placeholder="Learner answer…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

function PreviewMcq({ config }) {
  const [selected, setSelected] = useState([]);
  const toggle = (key) => {
    if (config.multiple) {
      setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
    } else {
      setSelected([key]);
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
      {(config.options || []).map((o) => (
        <label key={o.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border cursor-pointer hover:bg-canvas">
          <input
            type={config.multiple ? "checkbox" : "radio"}
            className="accent-emerald"
            checked={selected.includes(o.key)}
            onChange={() => toggle(o.key)}
          />
          <span className="text-sm text-brand-text">{o.text || `Option ${o.key}`}</span>
        </label>
      ))}
    </div>
  );
}

function PreviewAccordion({ config }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-canvas text-left" onClick={() => setOpen((o) => !o)}>
        <span className="text-sm font-semibold text-brand-text">{config.title || "Untitled"}</span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-xs text-brand-muted`} />
      </button>
      {open && <div className="px-4 py-3 lesson-content" dangerouslySetInnerHTML={{ __html: config.body || "" }} />}
    </div>
  );
}

function PreviewMatching({ config }) {
  const [picks, setPicks] = useState({});
  const rights = (config.pairs || []).map((p) => p.right).filter(Boolean);
  return (
    <div className="space-y-2">
      {(config.pairs || []).map((p, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-brand-border text-sm">{p.left}</span>
          <i className="fa-solid fa-arrow-right text-brand-muted text-xs"></i>
          <select
            className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
            value={picks[i] || ""}
            onChange={(e) => setPicks((s) => ({ ...s, [i]: e.target.value }))}
          >
            <option value="">Select match…</option>
            {rights.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function PaletteGroup({ title, fields, onAdd, open, onToggle, collapsible }) {
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={collapsible ? onToggle : undefined}
        className={`w-full flex items-center justify-between gap-2 mb-1.5 ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        aria-pressed={collapsible ? open : undefined}
      >
        <span className="text-[10px] font-bold text-brand-muted uppercase">{title}</span>
        {collapsible && (
          <span
            className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${open ? "bg-emerald" : "bg-brand-border"}`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${open ? "translate-x-3.5" : "translate-x-0.5"}`}
            />
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-2">
          {fields.map((f) => (
            <DraggableSidebarField key={f.kind} field={f} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableSidebarField({ field, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "sidebar-" + field.kind,
    data: { fromSidebar: true, kind: field.kind },
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      style={{ opacity: isDragging ? 0.45 : 1, cursor: "grab" }}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors select-none border-brand-border text-brand-muted hover:border-emerald/40 hover:text-emerald/70"
      onClick={() => onAdd(field.kind)}
    >
      <i className={`fa-solid ${field.icon} text-[11px]`}></i>
      {field.label}
    </button>
  );
}

function CanvasDropZone({ empty, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-colors ${
        empty
          ? `border-2 border-dashed p-12 text-center ${isOver ? "border-emerald bg-emerald/5" : "border-brand-border"}`
          : `p-1 ${isOver ? "bg-emerald/5 ring-2 ring-emerald/30" : ""}`
      }`}
    >
      {empty ? (
        <>
          <i className={`fa-solid fa-hand-pointer text-2xl mb-2 block ${isOver ? "text-emerald" : "text-brand-muted"}`}></i>
          <p className={`text-sm ${isOver ? "text-emerald font-semibold" : "text-brand-muted"}`}>
            {isOver ? "Drop here to add" : "Click or drag fields from the right to add them here"}
          </p>
        </>
      ) : children}
    </div>
  );
}

// Emerald insertion line shown between fields while dragging from the palette.
function DropLine() {
  return (
    <div className="relative h-0.5 my-1.5 rounded-full bg-emerald">
      <span className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-emerald" />
    </div>
  );
}

function SortableItem({ uid, kind, error, children, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: uid });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      id={`block-${uid}`}
      style={style}
      className={`border rounded-xl p-5 mb-4 bg-surface relative ${error ? "border-brand-danger ring-1 ring-brand-danger/30" : "border-brand-border"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="inline-flex items-center gap-1.5 text-xs text-brand-muted border border-brand-border rounded px-2 py-1 cursor-grab select-none"
        >
          <i className="fa-solid fa-grip-vertical text-[10px]"></i>
          {FIELD_META[kind]?.label || kind}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded text-brand-danger hover:bg-brand-danger/10 transition-colors"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand-danger mt-2.5">
          <i className="fa-solid fa-circle-exclamation"></i>
          {error}
        </p>
      )}
    </div>
  );
}

export default function LessonBuilder() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(lessonId);

  const [step, setStep] = useState(editing ? 2 : 1);
  const [view, setView] = useState("edit"); // edit | preview
  const [title, setTitle] = useState("");
  const [option, setOption] = useState("guide");
  const [themeId, setThemeId] = useState("");
  const [passPercent, setPassPercent] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [themes, setThemes] = useState([]);
  const [blocks, setBlocks] = useState([]); // [{uid, kind, category, config, answerKey}]
  const [activeDrag, setActiveDrag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [uploadingUids, setUploadingUids] = useState(() => new Set());
  const [contentOpen, setContentOpen] = useState(true);
  const [kcOpen, setKcOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { [uid]: message }
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [dropIndex, setDropIndex] = useState(null); // insertion slot during drag
  const [dragSource, setDragSource] = useState(null); // "sidebar" | "sort"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    api.get("/themes").then((res) => setThemes(res.data.themes || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) return;
    const load = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/lessons/${lessonId}`);
        const l = res.data.lesson;
        setTitle(l.title || "");
        setOption(l.option || "guide");
        setThemeId(l.theme?._id || l.theme || "");
        setPassPercent(l.passPercent ?? 70);
        setMaxAttempts(l.maxAttempts ?? 3);
        setBlocks(
          (l.blocks || []).map((b) => ({
            uid: crypto.randomUUID(),
            kind: b.kind,
            category: b.category,
            config: b.config || {},
            answerKey: b.answerKey || null,
          }))
        );
      } catch (err) {
        const reason = err.response?.data?.error || err.response?.data?.message || "Failed to load lesson";
        setLoadError(reason);
        toastr.error(reason);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editing, courseId, lessonId]);

  const selectedTheme = themes.find((t) => t._id === themeId) || null;

  const setUploading = (uid, on) =>
    setUploadingUids((prev) => {
      const next = new Set(prev);
      if (on) next.add(uid); else next.delete(uid);
      return next;
    });

  const changeOption = (next) => {
    const allowed = next === "resource" ? "content" : next === "quiz" ? "knowledge_check" : "both";
    if (blocks.length && allowed !== "both") {
      const bad = blocks.some((b) => b.category !== allowed);
      if (bad && !window.confirm("Switching type will remove fields not allowed in the new type. Continue?")) return;
      if (bad) setBlocks((prev) => prev.filter((b) => b.category === allowed));
    }
    setOption(next);
  };

  const makeBlock = (kind) => ({
    uid: crypto.randomUUID(),
    kind,
    category: categoryFor(kind),
    config: defaultConfig(kind),
    answerKey: kind === "mcq" ? { correctOptionKeys: [] } : null,
  });

  const addBlock = (kind) => setBlocks((prev) => [...prev, makeBlock(kind)]);

  // Insert a new block at a specific index (used when dropping between fields).
  const addBlockAt = (kind, index) =>
    setBlocks((prev) => {
      const next = [...prev];
      const at = index < 0 || index > next.length ? next.length : index;
      next.splice(at, 0, makeBlock(kind));
      return next;
    });

  const setFieldError = (uid, msg) =>
    setFieldErrors((prev) => ({ ...prev, [uid]: msg }));
  const clearFieldError = (uid) =>
    setFieldErrors((prev) => {
      if (!prev[uid]) return prev;
      const next = { ...prev };
      delete next[uid];
      return next;
    });

  const updateBlock = (uid, patch) => {
    clearFieldError(uid);
    setBlocks((prev) => prev.map((b) => (b.uid === uid ? { ...b, ...patch } : b)));
  };
  const updateConfig = (uid, patch) => {
    clearFieldError(uid);
    setBlocks((prev) => prev.map((b) => (b.uid === uid ? { ...b, config: { ...b.config, ...patch } } : b)));
  };
  const removeBlock = (uid) => {
    clearFieldError(uid);
    setBlocks((prev) => prev.filter((b) => b.uid !== uid));
  };

  function handleDragStart(event) {
    const { active } = event;
    if (active.data.current?.fromSidebar) {
      setDragSource("sidebar");
      setActiveDrag(FIELD_META[active.data.current.kind]);
    } else {
      setDragSource("sort");
      const b = blocks.find((x) => x.uid === active.id);
      setActiveDrag(b ? FIELD_META[b.kind] : null);
    }
  }

  // Compute the insertion slot (0..blocks.length) as the pointer moves, so the drop line
  // and the final insert agree. Over a block → before/after by which half the pointer is in;
  // over the empty canvas → end of the list.
  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) { setDropIndex(null); return; }
    const overIdx = blocks.findIndex((b) => b.uid === over.id);
    if (overIdx === -1) {
      setDropIndex(over.id === "canvas-drop" ? blocks.length : null);
      return;
    }
    const draggedRect = active.rect.current.translated || active.rect.current.initial;
    const draggedMid = draggedRect ? draggedRect.top + draggedRect.height / 2 : 0;
    const overMid = over.rect.top + over.rect.height / 2;
    setDropIndex(draggedMid < overMid ? overIdx : overIdx + 1);
  }

  function resetDrag() {
    setActiveDrag(null);
    setDragSource(null);
    setDropIndex(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const fromSidebar = active.data.current?.fromSidebar;
    const idx = dropIndex;
    resetDrag();
    if (!over) return;

    if (fromSidebar) {
      addBlockAt(active.data.current.kind, idx == null ? blocks.length : idx);
      return;
    }

    // Reorder: move the dragged block to the computed slot (accounting for its removal
    // shifting everything below it up by one).
    const oldIndex = blocks.findIndex((b) => b.uid === active.id);
    if (oldIndex === -1) return;
    let target = idx == null ? blocks.findIndex((b) => b.uid === over.id) : idx;
    if (target === -1) return;
    if (target > oldIndex) target -= 1;
    target = Math.max(0, Math.min(blocks.length - 1, target));
    if (target === oldIndex) return;
    setBlocks(arrayMove(blocks, oldIndex, target));
  }

  const uploadFile = async (uid, file, kind) => {
    if (!file) return;
    // Block oversized files locally so they never hit (and get rejected by) the proxy.
    if (file.size > MAX_UPLOAD_BYTES) {
      setFieldError(uid, "File is larger than 25 MB — compress it or use a link instead");
      return;
    }
    const type = kind === "image" ? "image" : "pdf";
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(uid, true);
      const res = await api.post(`/uploads/lessons/file/${type}`, formData);
      updateConfig(uid, {
        sourceType: "stored_file",
        contentUrl: res.data.publicUrl,
        storageKey: res.data.storageKey,
        fileName: res.data.fileName,
        mimeType: res.data.mimeType,
        fileSize: res.data.fileSize,
      });
      toastr.success("Uploaded");
    } catch (err) {
      const status = err.response?.status;
      setFieldError(
        uid,
        status === 413
          ? "File too large (max 25 MB)"
          : !err.response
          ? "Upload blocked — file may be too large or the server is unreachable"
          : err.response.data?.message || "Upload failed"
      );
    } finally {
      setUploading(uid, false);
    }
  };

  // Per-field validation. Returns { [uid]: message } for every block that isn't ready.
  const stripHtml = (html) =>
    (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

  function validateBlocks() {
    const errs = {};
    blocks.forEach((b) => {
      const c = b.config || {};
      switch (b.kind) {
        case "text":
        case "callout":
          if (!stripHtml(c.html)) errs[b.uid] = "Add some content";
          break;
        case "accordion":
          if (!c.title?.trim()) errs[b.uid] = "Add an accordion title";
          else if (!stripHtml(c.body)) errs[b.uid] = "Add accordion content";
          break;
        case "flip_card":
          if (!c.front?.trim() || !c.back?.trim()) errs[b.uid] = "Fill in both the front and back";
          break;
        case "image":
          if (!c.storageKey && !c.contentUrl) errs[b.uid] = "Upload an image";
          break;
        case "attach_file":
          if (!c.storageKey && !c.contentUrl) errs[b.uid] = "Upload a PDF";
          break;
        case "video_link":
          if (!c.contentUrl?.trim()) errs[b.uid] = "Add a video link";
          break;
        case "text_answer":
        case "file_upload":
        case "survey":
          if (!c.prompt?.trim()) errs[b.uid] = "Add a prompt for the learner";
          break;
        case "mcq": {
          if (!c.prompt?.trim()) { errs[b.uid] = "Add a question"; break; }
          const filled = (c.options || []).filter((o) => o.text?.trim());
          if (filled.length < 2) { errs[b.uid] = "Add at least 2 answer options"; break; }
          if (!(b.answerKey?.correctOptionKeys || []).length) errs[b.uid] = "Mark the correct answer";
          break;
        }
        case "matching": {
          const pairs = c.pairs || [];
          if (pairs.length < 2) { errs[b.uid] = "Add at least 2 pairs"; break; }
          if (pairs.some((p) => !p.left?.trim() || !p.right?.trim()))
            errs[b.uid] = "Fill in both sides of every pair";
          break;
        }
        case "esignature":
          if (!c.label?.trim()) errs[b.uid] = "Add a signature label";
          break;
        default:
          break;
      }
    });
    return errs;
  }

  const handleSave = async () => {
    if (!title.trim()) { setFormError("Lesson title is required."); return; }
    if (blocks.length === 0) { setFormError("Add at least one field before saving."); return; }
    const errs = validateBlocks();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      const count = Object.keys(errs).length;
      setFormError(`Fix the ${count} highlighted field${count > 1 ? "s" : ""} below, then save again.`);
      const firstUid = blocks.find((b) => errs[b.uid])?.uid;
      if (firstUid) {
        if (view !== "edit") setView("edit");
        setTimeout(
          () => document.getElementById(`block-${firstUid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
          0
        );
      }
      return;
    }
    setFormError("");
    const payload = {
      title: title.trim(),
      option,
      themeId: themeId || null,
      ...(option === "quiz" ? { passPercent: Number(passPercent), maxAttempts: Number(maxAttempts) } : {}),
      blocks: blocks.map((b, i) => ({
        kind: b.kind,
        category: b.category,
        order: i + 1,
        config: b.config,
        ...(GRADABLE.includes(b.kind) ? { answerKey: b.answerKey } : {}),
      })),
    };
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/courses/${courseId}/lessons/${lessonId}`, payload);
        toastr.success("Lesson updated");
      } else {
        await api.post(`/courses/${courseId}/lessons`, payload);
        toastr.success("Lesson created");
      }
      navigate(`/dashboard/courses/${courseId}/lessons`);
    } catch (err) {
      const msg = err.response?.data?.message || "Save failed — please try again.";
      setFormError(msg);
      toastr.error(msg);
    } finally {
      setSaving(false);
    }
  };

  function renderEditor(b) {
    const { uid, kind, config } = b;
    const uploading = uploadingUids.has(uid);
    switch (kind) {
      case "text":
        return (
          <div className="rounded-lg border border-brand-border bg-white overflow-hidden quill-clean">
            <ReactQuill theme="snow" value={config.html || ""} onChange={(val) => updateConfig(uid, { html: val })} placeholder="Write lesson content…" />
          </div>
        );
      case "callout":
        return (
          <div className="rounded-lg border border-emerald/40 border-l-4 border-l-emerald bg-emerald-muted/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald mb-2">
              <i className="fa-solid fa-bullhorn" /> Callout — highlighted info block
            </p>
            <div className="rounded-lg border border-emerald/30 bg-white overflow-hidden quill-clean">
              <ReactQuill theme="snow" value={config.html || ""} onChange={(val) => updateConfig(uid, { html: val })} placeholder="Important note learners should not miss…" />
            </div>
          </div>
        );
      case "accordion":
        return (
          <div className="space-y-2">
            <input className={fieldInputClass} placeholder="Accordion title" value={config.title || ""} onChange={(e) => updateConfig(uid, { title: e.target.value })} />
            <div className="rounded-lg border border-brand-border bg-white overflow-hidden quill-clean">
              <ReactQuill theme="snow" value={config.body || ""} onChange={(val) => updateConfig(uid, { body: val })} />
            </div>
          </div>
        );
      case "flip_card":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <textarea className={fieldInputClass} rows={4} placeholder="Front (question)" value={config.front || ""} onChange={(e) => updateConfig(uid, { front: e.target.value })} />
            <textarea className={fieldInputClass} rows={4} placeholder="Back (answer)" value={config.back || ""} onChange={(e) => updateConfig(uid, { back: e.target.value })} />
          </div>
        );
      case "divider":
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-brand-muted">Thickness</label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={config.thickness || 2}
                  onChange={(e) => updateConfig(uid, { thickness: Number(e.target.value) })}
                  className="accent-emerald w-36"
                />
                <span className="text-xs font-semibold text-brand-text w-10">{config.thickness || 2}px</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-brand-muted">Style</label>
                <select
                  className="px-2.5 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
                  value={config.style || "solid"}
                  onChange={(e) => updateConfig(uid, { style: e.target.value })}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </div>
            <div
              className="w-full"
              style={{
                height: 0,
                borderTopWidth: `${config.thickness || 2}px`,
                borderTopStyle: config.style || "solid",
                borderTopColor: "#E5E7EB",
              }}
            />
          </div>
        );
      case "video_link":
        return (
          <div className="space-y-2">
            <input className={fieldInputClass} placeholder="https://youtube.com/watch?v=..." value={config.contentUrl || ""} onChange={(e) => updateConfig(uid, { sourceType: "external_url", contentUrl: e.target.value })} />
            {config.contentUrl ? <YouTubePreview url={config.contentUrl} height={220} /> : null}
          </div>
        );
      case "image":
        return (
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50 w-fit">
              <i className="fa-solid fa-image text-emerald" /> {fileUrl(config) ? "Replace image" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadFile(uid, e.target.files[0], "image")} />
            </label>
            {uploading ? (
              <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-6 text-xs text-brand-muted">
                <i className="fa-solid fa-spinner fa-spin" /> Uploading…
              </div>
            ) : (
              <FilePreview src={fileUrl(config)} mimeType={config.mimeType} fileName={config.fileName} height={220} />
            )}
          </div>
        );
      case "attach_file":
        return (
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50 w-fit">
              <i className="fa-solid fa-file-pdf text-emerald" /> {fileUrl(config) ? "Replace PDF" : "Upload PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => uploadFile(uid, e.target.files[0], "attach_file")} />
            </label>
            {uploading ? (
              <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-6 text-xs text-brand-muted">
                <i className="fa-solid fa-spinner fa-spin" /> Uploading…
              </div>
            ) : (
              <FilePreview src={fileUrl(config)} mimeType={config.mimeType || "application/pdf"} fileName={config.fileName} height={260} />
            )}
          </div>
        );
      case "text_answer":
        return <input className={fieldInputClass} placeholder="Question / prompt for the learner" value={config.prompt || ""} onChange={(e) => updateConfig(uid, { prompt: e.target.value })} />;
      case "survey":
        return (
          <div className="space-y-3">
            <input className={fieldInputClass} placeholder="Survey question (learner picks a rating)" value={config.prompt || ""} onChange={(e) => updateConfig(uid, { prompt: e.target.value })} />
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-brand-muted">Scale max</label>
              <input
                type="number"
                min="2"
                max="10"
                className="w-20 px-2.5 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
                value={config.scaleMax || 5}
                onChange={(e) => updateConfig(uid, { scaleMax: Math.max(2, Math.min(10, Number(e.target.value) || 5)) })}
              />
            </div>
            <div>
              <p className="text-[11px] text-brand-muted mb-1">Preview</p>
              <NumberScale value={0} scaleMax={config.scaleMax || 5} disabled />
            </div>
          </div>
        );
      case "mcq":
        return renderMcq(b);
      case "matching":
        return renderMatching(b);
      case "file_upload":
        return <input className={fieldInputClass} placeholder="Prompt (e.g. Upload your completed worksheet)" value={config.prompt || ""} onChange={(e) => updateConfig(uid, { prompt: e.target.value })} />;
      case "esignature":
        return <input className={fieldInputClass} placeholder="Signature label (e.g. I acknowledge...)" value={config.label || ""} onChange={(e) => updateConfig(uid, { label: e.target.value })} />;
      default:
        return null;
    }
  }

  function renderMcq(b) {
    const { uid, config, answerKey } = b;
    const correct = answerKey?.correctOptionKeys || [];
    const toggleCorrect = (key) => {
      let next;
      if (config.multiple) {
        next = correct.includes(key) ? correct.filter((k) => k !== key) : [...correct, key];
      } else {
        next = [key];
      }
      updateBlock(uid, { answerKey: { correctOptionKeys: next } });
    };
    const setOptionText = (i, text) => {
      const opts = config.options.map((o, idx) => (idx === i ? { ...o, text } : o));
      updateConfig(uid, { options: opts });
    };
    const addOption = () => {
      const key = String.fromCharCode(65 + config.options.length);
      updateConfig(uid, { options: [...config.options, { key, text: "" }] });
    };
    const removeOption = (i) => {
      updateConfig(uid, { options: config.options.filter((_, idx) => idx !== i) });
    };
    return (
      <div className="space-y-2">
        <input className={fieldInputClass} placeholder="Question prompt" value={config.prompt || ""} onChange={(e) => updateConfig(uid, { prompt: e.target.value })} />
        <label className="flex items-center gap-2 text-xs text-brand-muted">
          <input type="checkbox" className="accent-emerald" checked={!!config.multiple} onChange={(e) => updateConfig(uid, { multiple: e.target.checked })} />
          Allow multiple correct answers
        </label>
        <p className="text-[11px] text-brand-muted">Mark the correct answer(s) — hidden from the learner.</p>
        {config.options.map((o, i) => (
          <div key={o.key} className="flex items-center gap-2">
            <input
              type={config.multiple ? "checkbox" : "radio"}
              name={`correct-${uid}`}
              className="accent-emerald flex-shrink-0"
              checked={correct.includes(o.key)}
              onChange={() => toggleCorrect(o.key)}
            />
            <span className="text-xs font-bold text-brand-muted w-4">{o.key}</span>
            <input className={optionInputClass} placeholder={`Option ${o.key}`} value={o.text} onChange={(e) => setOptionText(i, e.target.value)} />
            {config.options.length > 2 && (
              <button type="button" className="text-brand-danger" onClick={() => removeOption(i)}><i className="fa-solid fa-xmark"></i></button>
            )}
          </div>
        ))}
        <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-emerald-hover" onClick={addOption}>
          <i className="fa-solid fa-plus text-[9px]"></i> Add Option
        </button>
      </div>
    );
  }

  function renderMatching(b) {
    const { uid, config } = b;
    const setPair = (i, side, val) => {
      const pairs = config.pairs.map((p, idx) => (idx === i ? { ...p, [side]: val } : p));
      updateConfig(uid, { pairs });
    };
    const addPair = () => updateConfig(uid, { pairs: [...config.pairs, { left: "", right: "" }] });
    const removePair = (i) => updateConfig(uid, { pairs: config.pairs.filter((_, idx) => idx !== i) });
    return (
      <div className="space-y-2">
        <p className="text-[11px] text-brand-muted">Define matching pairs (min 2). Learners connect each left item to its right match; the correct pairing is stored and hidden.</p>
        {config.pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={optionInputClass} placeholder="Left" value={p.left} onChange={(e) => setPair(i, "left", e.target.value)} />
            <i className="fa-solid fa-arrows-left-right text-brand-muted text-xs"></i>
            <input className={optionInputClass} placeholder="Right" value={p.right} onChange={(e) => setPair(i, "right", e.target.value)} />
            {config.pairs.length > 2 && (
              <button type="button" className="text-brand-danger" onClick={() => removePair(i)}><i className="fa-solid fa-xmark"></i></button>
            )}
          </div>
        ))}
        <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-emerald-hover" onClick={addPair}>
          <i className="fa-solid fa-plus text-[9px]"></i> Add Pair
        </button>
      </div>
    );
  }

  // Learner-style read-only render for the Preview tab.
  function renderPreviewBlock(b) {
    const { kind, config } = b;
    switch (kind) {
      case "text":
        return <div className="lesson-content" dangerouslySetInnerHTML={{ __html: config.html || "" }} />;
      case "callout":
        return <div className="rounded-lg border-l-4 border-emerald bg-emerald-muted/40 p-4 lesson-content" dangerouslySetInnerHTML={{ __html: config.html || "" }} />;
      case "divider":
        return (
          <div
            className="w-full"
            style={{
              height: 0,
              borderTopWidth: `${config.thickness || 2}px`,
              borderTopStyle: config.style || "solid",
              borderTopColor: "#E5E7EB",
            }}
          />
        );
      case "accordion":
        return <PreviewAccordion config={config} />;
      case "flip_card":
        return <FlipCard config={config} />;
      case "image":
        return <FilePreview src={fileUrl(config)} mimeType={config.mimeType} fileName={config.fileName} height={280} />;
      case "attach_file":
        return <FilePreview src={fileUrl(config)} mimeType={config.mimeType || "application/pdf"} fileName={config.fileName} height={420} />;
      case "video_link":
        return config.contentUrl ? <YouTubePreview url={config.contentUrl} height={360} /> : <p className="text-xs text-brand-muted">No video link</p>;
      case "text_answer":
        return <PreviewTextAnswer config={config} />;
      case "mcq":
        return <PreviewMcq config={config} />;
      case "survey":
        return <PreviewSurvey config={config} />;
      case "matching":
        return <PreviewMatching config={config} />;
      case "file_upload":
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
            <input type="file" disabled className="text-xs text-brand-muted" />
          </div>
        );
      case "esignature":
        return <SignaturePad label={config.label || "Sign below"} />;
      default:
        return null;
    }
  }

  if (loading) {
    return <p className="text-brand-muted text-sm p-6">Loading lesson…</p>;
  }

  if (editing && loadError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Edit Lesson" subtitle="Edit lesson content and settings">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-white !border-white/20 hover:!bg-white/10"
            leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
            onClick={() => navigate(`/dashboard/courses/${courseId}/lessons`)}
          >
            Back
          </Button>
        </PageHeader>
        <div className="bg-surface border border-brand-border rounded-xl p-8 text-center space-y-2">
          <i className="fa-solid fa-circle-exclamation text-brand-danger text-xl" />
          <p className="text-sm font-semibold text-brand-text">Couldn't load this lesson</p>
          <p className="text-xs text-brand-muted">{loadError}</p>
        </div>
      </div>
    );
  }

  const subtitle = editing
    ? "Edit lesson content and settings"
    : step === 1 ? "Step 1 — name and type your lesson"
    : "Step 2 — build your lesson";

  return (
    <div className="space-y-5">
      <PageHeader title={editing ? "Edit Lesson" : "New Lesson"} subtitle={subtitle}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="!text-white !border-white/20 hover:!bg-white/10"
          leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
          onClick={() => navigate(`/dashboard/courses/${courseId}/lessons`)}
        >
          Back
        </Button>
      </PageHeader>

      {!editing && (
        <div className="bg-surface border border-brand-border rounded-xl p-4">
          <StepIndicator current={step} />
        </div>
      )}

      {/* ── STEP 1 — Details (Title + Type) ── */}
      {!editing && step === 1 && (
        <AnimatePresence mode="wait">
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="bg-surface border border-brand-border rounded-xl p-6 max-w-2xl">
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Lesson Title</label>
              <input
                autoFocus
                className={fieldInputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hand Hygiene Basics"
                onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) setStep(2); }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-3">Lesson Type</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TYPE_OPTIONS.map((t) => {
                  const active = option === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => changeOption(t.value)}
                      className={`text-left p-5 rounded-xl border-2 transition-colors ${active ? "border-emerald bg-emerald/5" : "border-brand-border hover:border-emerald/40 bg-surface"}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${active ? "bg-emerald text-white" : "bg-canvas text-brand-muted"}`}>
                        <i className={`fa-solid ${t.icon}`} />
                      </div>
                      <p className="text-body font-semibold text-brand-text mb-1">{t.label}</p>
                      <p className="text-caption text-brand-muted">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" disabled={!title.trim()} trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── STEP 2 — Build ── */}
      {step === 2 && (
        <>
          {/* Lesson meta — title as heading (inline edit) + theme; no type dropdown */}
          <div className="bg-surface border border-brand-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className={fieldInputClass}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) setEditingTitle(false); if (e.key === "Escape") setEditingTitle(false); }}
                      placeholder="e.g. Hand Hygiene Basics"
                    />
                    <Button size="sm" variant="primary" disabled={!title.trim()} onClick={() => setEditingTitle(false)}>Done</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-heading text-brand-text truncate">{title || "Untitled lesson"}</h2>
                    <button
                      type="button"
                      onClick={() => setEditingTitle(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-muted hover:text-emerald hover:bg-emerald/10 transition-colors flex-shrink-0"
                      aria-label="Edit title"
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                  </div>
                )}
                <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                  <i className={`fa-solid ${TYPE_OPTIONS.find((t) => t.value === option)?.icon || "fa-book-open"}`} />
                  {TYPE_OPTIONS.find((t) => t.value === option)?.label || option}
                </span>
              </div>

              <div className="flex items-end gap-3 flex-wrap">
                {option === "quiz" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Pass %</label>
                      <input type="number" min="0" max="100" className={`${fieldInputClass} w-24`} value={passPercent} onChange={(e) => setPassPercent(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Max Attempts</label>
                      <input type="number" min="1" className={`${fieldInputClass} w-24`} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lesson appearance */}
          <ThemeSelector themes={themes} themeId={themeId} setThemeId={setThemeId} />

          {/* Save / validation banner */}
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-danger/40 bg-brand-danger/5 px-4 py-3 text-sm text-brand-danger">
              <i className="fa-solid fa-circle-exclamation mt-0.5" />
              <span className="flex-1 font-medium">{formError}</span>
              <button
                type="button"
                onClick={() => setFormError("")}
                className="text-brand-danger/70 hover:text-brand-danger"
                aria-label="Dismiss"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          {/* Edit / Preview tabs */}
          <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
            {["edit", "preview"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${view === v ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
              >
                <i className={`fa-solid ${v === "edit" ? "fa-pen" : "fa-eye"} mr-1.5 text-xs`} />
                {v}
              </button>
            ))}
          </div>

          {view === "preview" ? (
            <ThemeScope theme={selectedTheme}>
              <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-4">
                {blocks.length === 0 ? (
                  <p className="text-sm text-brand-muted text-center py-8">Add fields to preview</p>
                ) : (
                  blocks.map((b) => <div key={b.uid}>{renderPreviewBlock(b)}</div>)
                )}
              </div>
            </ThemeScope>
          ) : (
            <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={resetDrag}>
              <div className="flex gap-5 items-start">
                {/* Canvas */}
                <div className="flex-1 min-w-0">
                  <CanvasDropZone empty={blocks.length === 0}>
                    <SortableContext items={blocks.map((b) => b.uid)} strategy={verticalListSortingStrategy}>
                      {blocks.map((b, i) => (
                        <Fragment key={b.uid}>
                          {dragSource === "sidebar" && dropIndex === i && <DropLine />}
                          <SortableItem uid={b.uid} kind={b.kind} error={fieldErrors[b.uid]} onRemove={() => removeBlock(b.uid)}>
                            {renderEditor(b)}
                          </SortableItem>
                        </Fragment>
                      ))}
                      {dragSource === "sidebar" && dropIndex === blocks.length && <DropLine />}
                    </SortableContext>
                  </CanvasDropZone>
                </div>

                {/* Field palette */}
                <div className="w-56 flex-shrink-0 self-start sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Fields</p>
                  <p className="text-[10px] text-brand-muted mb-3">
                    {option === "resource" ? "Content fields" : option === "quiz" ? "Knowledge check fields" : "Toggle a group to show its fields"}
                  </p>
                  <div className="space-y-1">
                    {option !== "quiz" && (
                      <PaletteGroup
                        title="Content"
                        fields={CONTENT_FIELDS}
                        onAdd={addBlock}
                        open={option === "guide" ? contentOpen : true}
                        onToggle={() => setContentOpen((o) => !o)}
                        collapsible={option === "guide"}
                      />
                    )}
                    {option !== "resource" && (
                      <PaletteGroup
                        title="Knowledge Check"
                        fields={KC_FIELDS}
                        onAdd={addBlock}
                        open={option === "guide" ? kcOpen : true}
                        onToggle={() => setKcOpen((o) => !o)}
                        collapsible={option === "guide"}
                      />
                    )}
                  </div>
                </div>
              </div>

              <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
                {activeDrag ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-emerald bg-emerald/10 text-emerald text-xs font-semibold shadow-xl cursor-grabbing select-none">
                    <i className={`fa-solid ${activeDrag.icon} text-[11px]`} />
                    {activeDrag.label}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* Save bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!editing ? (
              <Button variant="ghost" leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />} onClick={() => setStep(1)}>Back</Button>
            ) : <span />}
            {blocks.length > 0 && (
              <Button variant="primary" loading={saving} onClick={handleSave}>
                {editing ? "Update Lesson" : "Save Lesson"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
