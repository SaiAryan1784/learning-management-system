import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";

const BASE_URL = api.defaults.baseURL || "";
const FILE_BASE_URL = BASE_URL.replace("/api", "");

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

function categoryFor(kind) {
  return CONTENT_KINDS.includes(kind) ? "content" : "knowledge_check";
}

function defaultConfig(kind) {
  switch (kind) {
    case "text":
    case "callout": return { html: "" };
    case "accordion": return { title: "", body: "" };
    case "flip_card": return { front: "", back: "" };
    case "divider": return {};
    case "video_link": return { sourceType: "external_url", contentUrl: "" };
    case "image":
    case "attach_file": return { sourceType: "stored_file" };
    case "text_answer": return { prompt: "" };
    case "mcq": return { prompt: "", multiple: false, options: [{ key: "A", text: "" }, { key: "B", text: "" }] };
    case "survey": return { prompt: "", scaleMax: 5 };
    case "matching": return { pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] };
    case "file_upload": return { prompt: "" };
    case "esignature": return { label: "Sign here" };
    default: return {};
  }
}

const fieldInputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";

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

function SortableItem({ uid, kind, children, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: uid });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="border border-brand-border rounded-xl p-5 mb-4 bg-surface relative">
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
    </div>
  );
}

export default function LessonBuilder() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(lessonId);

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
      } catch {
        toastr.error("Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editing, courseId, lessonId]);

  const palette = option === "resource" ? CONTENT_FIELDS : option === "quiz" ? KC_FIELDS : [...CONTENT_FIELDS, ...KC_FIELDS];

  const addBlock = (kind) => {
    setBlocks((prev) => [
      ...prev,
      {
        uid: crypto.randomUUID(),
        kind,
        category: categoryFor(kind),
        config: defaultConfig(kind),
        answerKey: kind === "mcq" ? { correctOptionKeys: [] } : null,
      },
    ]);
  };

  const updateBlock = (uid, patch) => {
    setBlocks((prev) => prev.map((b) => (b.uid === uid ? { ...b, ...patch } : b)));
  };
  const updateConfig = (uid, patch) => {
    setBlocks((prev) => prev.map((b) => (b.uid === uid ? { ...b, config: { ...b.config, ...patch } } : b)));
  };
  const removeBlock = (uid) => setBlocks((prev) => prev.filter((b) => b.uid !== uid));

  function handleDragStart(event) {
    const { active } = event;
    if (active.data.current?.fromSidebar) {
      setActiveDrag(FIELD_META[active.data.current.kind]);
    } else {
      const b = blocks.find((x) => x.uid === active.id);
      setActiveDrag(b ? FIELD_META[b.kind] : null);
    }
  }

  function handleDragEnd(event) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.fromSidebar) {
      addBlock(active.data.current.kind);
      return;
    }
    if (active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.uid === active.id);
    const newIndex = blocks.findIndex((b) => b.uid === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setBlocks(arrayMove(blocks, oldIndex, newIndex));
  }

  const uploadFile = async (uid, file, kind) => {
    if (!file) return;
    const type = kind === "image" ? "image" : "pdf";
    const formData = new FormData();
    formData.append("file", file);
    try {
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
    } catch {
      toastr.error("Upload failed");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return toastr.warning("Lesson title is required");
    if (blocks.length === 0) return toastr.warning("Add at least one field");
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
      toastr.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  function renderEditor(b) {
    const { uid, kind, config } = b;
    switch (kind) {
      case "text":
      case "callout":
        return (
          <ReactQuill theme="snow" value={config.html || ""} onChange={(val) => updateConfig(uid, { html: val })} />
        );
      case "accordion":
        return (
          <div className="space-y-2">
            <input className={fieldInputClass} placeholder="Accordion title" value={config.title || ""} onChange={(e) => updateConfig(uid, { title: e.target.value })} />
            <ReactQuill theme="snow" value={config.body || ""} onChange={(val) => updateConfig(uid, { body: val })} />
          </div>
        );
      case "flip_card":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <textarea className={fieldInputClass} rows={3} placeholder="Front (question)" value={config.front || ""} onChange={(e) => updateConfig(uid, { front: e.target.value })} />
            <textarea className={fieldInputClass} rows={3} placeholder="Back (answer)" value={config.back || ""} onChange={(e) => updateConfig(uid, { back: e.target.value })} />
          </div>
        );
      case "divider":
        return <hr className="border-brand-border" />;
      case "video_link":
        return (
          <div className="space-y-2">
            <input className={fieldInputClass} placeholder="https://youtube.com/watch?v=..." value={config.contentUrl || ""} onChange={(e) => updateConfig(uid, { sourceType: "external_url", contentUrl: e.target.value })} />
            {config.contentUrl ? <iframe className="w-full rounded-lg" height="220" src={youtubeEmbed(config.contentUrl)} title="preview" allowFullScreen /> : null}
          </div>
        );
      case "image":
        return (
          <div className="space-y-2">
            <input type="file" accept="image/*" className="text-xs text-brand-muted" onChange={(e) => uploadFile(uid, e.target.files[0], "image")} />
            {fileUrl(config) ? <img className="w-full rounded-lg max-h-64 object-contain" src={fileUrl(config)} alt={config.fileName || ""} /> : null}
          </div>
        );
      case "attach_file":
        return (
          <div className="space-y-2">
            <input type="file" accept="application/pdf" className="text-xs text-brand-muted" onChange={(e) => uploadFile(uid, e.target.files[0], "attach_file")} />
            {fileUrl(config) ? <iframe className="w-full rounded-lg" height="220" src={fileUrl(config)} title="pdf preview" /> : null}
          </div>
        );
      case "text_answer":
        return <input className={fieldInputClass} placeholder="Question / prompt for the learner" value={config.prompt || ""} onChange={(e) => updateConfig(uid, { prompt: e.target.value })} />;
      case "survey":
        return (
          <div className="space-y-2">
            <input className={fieldInputClass} placeholder="Survey question (learner rates 1-5)" value={config.prompt || ""} onChange={(e) => updateConfig(uid, { prompt: e.target.value })} />
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: config.scaleMax || 5 }).map((_, i) => (
                <i key={i} className="fa-solid fa-star"></i>
              ))}
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
            <input className="flex-1 px-3 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald" placeholder={`Option ${o.key}`} value={o.text} onChange={(e) => setOptionText(i, e.target.value)} />
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
        <p className="text-[11px] text-brand-muted">Define matching pairs (min 4). Learners draw lines to connect them; the correct pairing is stored and hidden.</p>
        {config.pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="flex-1 px-3 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald" placeholder="Left" value={p.left} onChange={(e) => setPair(i, "left", e.target.value)} />
            <i className="fa-solid fa-arrows-left-right text-brand-muted text-xs"></i>
            <input className="flex-1 px-3 py-1.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald" placeholder="Right" value={p.right} onChange={(e) => setPair(i, "right", e.target.value)} />
            {config.pairs.length > 4 && (
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

  if (loading) {
    return <p className="text-brand-muted text-sm p-6">Loading lesson…</p>;
  }

  return (
    <div className="space-y-5">
      <PageHeader title={editing ? "Edit Lesson" : "New Lesson"} subtitle="Pick a lesson type, then drag fields onto the canvas">
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

      {/* Lesson meta */}
      <div className="bg-surface border border-brand-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Lesson Title</label>
          <input className={fieldInputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hand Hygiene Basics" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Lesson Type</label>
          <select
            className={fieldInputClass}
            value={option}
            onChange={(e) => {
              const next = e.target.value;
              const allowed = next === "resource" ? "content" : next === "quiz" ? "knowledge_check" : "both";
              if (blocks.length && allowed !== "both") {
                const bad = blocks.some((b) => b.category !== allowed);
                if (bad && !window.confirm("Switching type will remove fields not allowed in the new type. Continue?")) return;
                if (bad) setBlocks((prev) => prev.filter((b) => b.category === allowed));
              }
              setOption(next);
            }}
          >
            <option value="resource">Resource — content only</option>
            <option value="guide">Guide — content + knowledge checks</option>
            <option value="quiz">Quiz — knowledge checks only</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Theme</label>
          <select className={fieldInputClass} value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            <option value="">Default (no theme)</option>
            {themes.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        {option === "quiz" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Pass %</label>
              <input type="number" min="0" max="100" className={fieldInputClass} value={passPercent} onChange={(e) => setPassPercent(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Max Attempts</label>
              <input type="number" min="1" className={fieldInputClass} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-5">
          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <CanvasDropZone empty={blocks.length === 0}>
              <SortableContext items={blocks.map((b) => b.uid)} strategy={verticalListSortingStrategy}>
                {blocks.map((b) => (
                  <SortableItem key={b.uid} uid={b.uid} kind={b.kind} onRemove={() => removeBlock(b.uid)}>
                    {renderEditor(b)}
                  </SortableItem>
                ))}
              </SortableContext>
            </CanvasDropZone>

            {blocks.length > 0 && (
              <Button variant="primary" loading={saving} className="mt-3" onClick={handleSave}>
                {editing ? "Update Lesson" : "Save Lesson"}
              </Button>
            )}
          </div>

          {/* Field palette */}
          <div className="w-56 flex-shrink-0">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Fields</p>
            <p className="text-[10px] text-brand-muted mb-3">
              {option === "resource" ? "Content fields" : option === "quiz" ? "Knowledge check fields" : "Content + knowledge check"}
            </p>
            <div className="space-y-2">
              {option !== "quiz" && (
                <>
                  <p className="text-[10px] font-bold text-brand-muted uppercase mt-1">Content</p>
                  {CONTENT_FIELDS.map((f) => (
                    <DraggableSidebarField key={f.kind} field={f} onAdd={addBlock} />
                  ))}
                </>
              )}
              {option !== "resource" && (
                <>
                  <p className="text-[10px] font-bold text-brand-muted uppercase mt-3">Knowledge Check</p>
                  {KC_FIELDS.map((f) => (
                    <DraggableSidebarField key={f.kind} field={f} onAdd={addBlock} />
                  ))}
                </>
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
    </div>
  );
}
