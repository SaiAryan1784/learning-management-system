import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

const BASE_URL = api.defaults.baseURL;
const FILE_BASE_URL = BASE_URL.replace("/api", "");

const getFileUrl = (block) => {
  if (!block) return "";
  if (block.publicUrl) return block.publicUrl.startsWith("http") ? block.publicUrl : `${FILE_BASE_URL}${block.publicUrl}`;
  if (block.storageKey) return `${FILE_BASE_URL}/uploads/${block.storageKey}`;
  return "";
};

const upsertBlock = (setBlocks, newBlock) => {
  setBlocks((prev) => {
    const index = prev.findIndex((b) => b.type === newBlock.type);
    if (index !== -1) {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...newBlock };
      return updated;
    }
    return [...prev, newBlock];
  });
};

function DraggableSidebarField({ field, inCanvas, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "sidebar-" + field.id,
    data: { fromSidebar: true, fieldId: field.id },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      style={{ opacity: isDragging ? 0.45 : 1, cursor: "grab" }}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors select-none ${
        inCanvas
          ? "border-emerald bg-emerald/5 text-emerald"
          : "border-brand-border text-brand-muted hover:border-emerald/40 hover:text-emerald/70"
      }`}
      onClick={() => onAdd(field.id)}
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
      ) : (
        children
      )}
    </div>
  );
}

function SortableItem({ id, renderField, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="border border-brand-border rounded-xl p-5 mb-4 bg-surface relative">
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="inline-flex items-center gap-1.5 text-xs text-brand-muted border border-brand-border rounded px-2 py-1 mb-3 cursor-grab select-none"
      >
        <i className="fa-solid fa-grip-vertical text-[10px]"></i> Drag
      </div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded text-brand-danger hover:bg-brand-danger/10 transition-colors"
      >
        <i className="fa-solid fa-xmark text-xs"></i>
      </button>
      {renderField(id)}
    </div>
  );
}

const fieldInputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";

export default function ModuleLessons() {
  const { courseId, moduleId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({
    title: "", summary: "", type: "", sourceType: "external_url",
    publicUrl: "", textContent: "", order: 1, storageKey: "", fileName: "", mimeType: "", fileSize: 0,
  });
  const [filePreview, setFilePreview] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [activeTab, setActiveTab] = useState("addLesson");
  const [loading, setLoading] = useState(false);
  const [canvasFields, setCanvasFields] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sidebarFields = [
    { id: "title", label: "Lesson Title", icon: "fa-heading" },
    { id: "video", label: "Add Video", icon: "fa-video" },
    { id: "image", label: "Add Image", icon: "fa-image" },
    { id: "pdf", label: "Add PDF", icon: "fa-file-pdf" },
    { id: "text", label: "Add Text", icon: "fa-align-left" },
    { id: "order", label: "Display Order", icon: "fa-sort" },
  ];

  function handleDragStart(event) {
    const { active } = event;
    if (active.data.current?.fromSidebar) {
      const field = sidebarFields.find(f => f.id === active.data.current.fieldId);
      setActiveDragItem(field || null);
    } else {
      const field = sidebarFields.find(f => f.id === String(active.id));
      setActiveDragItem(field || { id: active.id, label: String(active.id), icon: "fa-grip-vertical" });
    }
  }

  function handleDragEnd(event) {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.fromSidebar) {
      const fieldId = active.data.current.fieldId;
      if (canvasFields.includes(fieldId)) return;
      if (over.id === "canvas-drop" || !canvasFields.includes(String(over.id))) {
        setCanvasFields((prev) => [...prev, fieldId]);
      } else {
        const overIndex = canvasFields.indexOf(String(over.id));
        setCanvasFields((prev) => {
          const next = [...prev];
          next.splice(overIndex, 0, fieldId);
          return next;
        });
      }
      return;
    }

    if (active.id === over.id) return;
    const oldIndex = canvasFields.indexOf(String(active.id));
    const newIndex = canvasFields.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    setCanvasFields(arrayMove(canvasFields, oldIndex, newIndex));
  }

  const loadLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}/modules/${moduleId}/lessons?active=true&page=1&limit=100`);
      setLessons(res.data.lessons || []);
    } catch {
      toastr.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLessons(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file, type) => {
    const finalType = type || form.type;
    if (!file || !finalType) return;
    const previewUrl = URL.createObjectURL(file);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(`/uploads/lessons/file/${finalType}`, formData);
      upsertBlock(setBlocks, {
        type: finalType, sourceType: "stored_file",
        publicUrl: res.data.publicUrl, storageKey: res.data.storageKey,
        fileName: res.data.fileName, mimeType: res.data.mimeType, fileSize: res.data.fileSize,
        preview: previewUrl,
      });
      setUploadedFileName(res.data.fileName);
      toastr.success("Uploaded");
    } catch {
      toastr.error("Upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blocks.length === 0) return toastr.warning("Add at least one block");
    const payload = {
      title: form.title, order: Number(form.order),
      blocks: blocks.map((b, index) => ({
        type: b.type, order: index + 1, sourceType: b.sourceType, contentText: b.contentText || "",
        contentUrl: b.sourceType === "external_url" ? b.publicUrl : undefined,
        publicUrl: b.sourceType === "stored_file" ? b.publicUrl : undefined,
        storageKey: b.storageKey || "", fileName: b.fileName || "", mimeType: b.mimeType || "", fileSize: b.fileSize || 0,
      })),
      active: true,
    };
    try {
      if (editId) {
        await api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${editId}`, payload);
      } else {
        await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, payload);
      }
      setBlocks([]); setCanvasFields([]);
      setForm({ title: "", publicUrl: "", textContent: "", order: 1 });
      setEditId(null); setFilePreview(""); setSelectedType("");
      loadLessons();
      setActiveTab("lessonList");
    } catch {
      toastr.error("Save failed");
    }
  };

  function renderField(id) {
    const currentBlock = blocks.filter((b) => b.type === id).slice(-1)[0];
    switch (id) {
      case "title":
        return (
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Lesson Title</label>
            <input className={fieldInputClass} name="title" value={form.title} onChange={handleChange} placeholder="Lesson title" />
          </div>
        );
      case "video":
      case "image":
      case "pdf":
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
              {id === "video" ? "Video" : id === "image" ? "Image" : "PDF"}
            </p>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Content URL</label>
              <input
                className={fieldInputClass}
                type="text"
                name="publicUrl"
                value={form.publicUrl}
                onChange={(e) => {
                  setSelectedType(id);
                  upsertBlock(setBlocks, { type: id, sourceType: "external_url", publicUrl: e.target.value });
                  setForm((prev) => ({ ...prev, publicUrl: e.target.value, type: id, sourceType: "external_url" }));
                }}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Upload File</label>
              <input
                type="file"
                accept={id === "pdf" ? "application/pdf" : "*"}
                className="text-xs text-brand-muted"
                onChange={(e) => { setSelectedType(id); setForm((prev) => ({ ...prev, type: id })); uploadFile(e.target.files[0], id); }}
              />
              {currentBlock?.preview && id === "video" && <video className="mt-2 w-full rounded-lg" controls src={currentBlock.preview} />}
              {currentBlock?.preview && id === "image" && <img className="mt-2 w-full rounded-lg" src={currentBlock.preview} alt="" />}
              {currentBlock?.preview && id === "pdf" && <iframe className="mt-2 w-full rounded" src={currentBlock.preview} height="120" title="PDF Preview" />}
              {currentBlock?.fileName && (
                <div className="mt-2 flex items-center gap-2 bg-canvas border border-brand-border rounded-lg px-3 py-2">
                  <i className="fa fa-file text-brand-muted text-sm"></i>
                  <span className="text-xs text-brand-text">{currentBlock.fileName}</span>
                </div>
              )}
            </div>
          </div>
        );
      case "text":
        return (
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Text Content</label>
            <ReactQuill
              value={form.textContent}
              onChange={(val) => {
                upsertBlock(setBlocks, { type: "text", sourceType: "inline", contentText: val });
                setForm((prev) => ({ ...prev, textContent: val }));
              }}
            />
          </div>
        );
      case "order":
        return (
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Display Order</label>
            <input className="w-24 px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent" name="order" value={form.order} onChange={handleChange} type="number" />
          </div>
        );
      default:
        return null;
    }
  }

  const handleEdit = (lesson) => {
    setEditId(lesson._id);
    const blocksData = lesson.blocks || [];
    const fixedBlocks = blocksData.map((b) => ({
      ...b,
      publicUrl: b.publicUrl
        ? (b.publicUrl.startsWith("http") ? b.publicUrl : `${FILE_BASE_URL}${b.publicUrl}`)
        : b.storageKey ? `${FILE_BASE_URL}/uploads/${b.storageKey}` : "",
    }));
    setBlocks(fixedBlocks);
    setForm({ title: lesson.title, order: lesson.order, publicUrl: "", textContent: "" });
    setCanvasFields(["title", ...blocksData.map((b) => b.type), "order"]);
    setActiveTab("addLesson");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${id}`);
      toastr.success("Deleted");
      loadLessons();
    } catch {
      toastr.error("Delete failed");
    }
  };

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Lessons" subtitle="Add and manage lessons for this module" />

      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {[{ key: "addLesson", label: editId ? "Edit Lesson" : "Add Lesson" }, { key: "lessonList", label: "Lesson List" }].map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === key ? "bg-charcoal text-white" : "text-brand-muted hover:text-brand-text"}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "addLesson" && (
        <div className="flex gap-5">
          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-0">
              <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <CanvasDropZone empty={canvasFields.length === 0}>
                  <SortableContext items={canvasFields} strategy={verticalListSortingStrategy}>
                    {canvasFields.map((id) => (
                      <SortableItem
                        key={id}
                        id={id}
                        renderField={renderField}
                        onRemove={(f) => setCanvasFields((prev) => prev.filter((x) => x !== f))}
                      />
                    ))}
                  </SortableContext>
                </CanvasDropZone>

                <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
                  {activeDragItem ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-emerald bg-emerald/10 text-emerald text-xs font-semibold shadow-xl cursor-grabbing select-none">
                      <i className={`fa-solid ${activeDragItem.icon} text-[11px]`} />
                      {activeDragItem.label}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {canvasFields.length > 0 && (
                <button
                  type="submit"
                  className="mt-3 bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
                >
                  {editId ? "Update Lesson" : "Save Lesson"}
                </button>
              )}
            </form>
          </div>

          {/* Sidebar */}
          <div className="w-52 flex-shrink-0">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Fields</p>
            <p className="text-[10px] text-brand-muted mb-3">Click or drag into canvas</p>
            <div className="space-y-2">
              {sidebarFields.map((field) => (
                <DraggableSidebarField
                  key={field.id}
                  field={field}
                  inCanvas={canvasFields.includes(field.id)}
                  onAdd={(id) => {
                    if (!canvasFields.includes(id)) {
                      setCanvasFields((prev) => [...prev, id]);
                    }
                    if (["video", "image", "pdf", "text"].includes(id)) {
                      setSelectedType(id);
                      setForm((prev) => ({ ...prev, type: id, publicUrl: "", textContent: "" }));
                      setFilePreview("");
                      setUploadedFileName("");
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "lessonList" && (
        <div className="bg-surface border border-brand-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-canvas">
                {["Title", "Type", "Preview", "Order", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-brand-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {lessons.map((lesson) => (
                <tr key={lesson._id} className="hover:bg-canvas transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-text">{lesson.title}</td>
                  <td className="px-4 py-3 text-brand-muted">{lesson.blocks?.map((b) => b.type).join(", ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {lesson.blocks?.map((block, i) => {
                        const fileUrl = getFileUrl(block);
                        return (
                          <div key={i}>
                            {block.type === "video" ? (
                              <video width="200" controls><source src={fileUrl} /></video>
                            ) : block.type === "image" ? (
                              <img src={fileUrl} width="120" alt="" className="rounded" />
                            ) : block.type === "pdf" ? (
                              <iframe src={fileUrl} width="200" height="100" title="pdf" className="rounded" />
                            ) : (
                              <div className="text-xs text-brand-muted line-clamp-2" dangerouslySetInnerHTML={{ __html: block.contentText }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{lesson.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className={actionBtn} onClick={() => handleEdit(lesson)} title="Edit">
                        <i className="fa fa-edit text-xs"></i>
                      </button>
                      <button className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`} onClick={() => handleDelete(lesson._id)} title="Delete">
                        <i className="fa fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr><td colSpan="5" className="px-4 py-12 text-center text-brand-muted">No lessons yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
