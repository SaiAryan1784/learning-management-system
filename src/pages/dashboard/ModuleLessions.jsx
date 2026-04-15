// src/pages/dashboard/ModuleLessons.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const BASE_URL = api.defaults.baseURL;
const FILE_BASE_URL = BASE_URL.replace("/api", "");

/* ================= HELPER ================= */
const getFileUrl = (block) => {
  if (!block) return "";

  if (block.publicUrl) {
    return block.publicUrl.startsWith("http")
      ? block.publicUrl
      : `${FILE_BASE_URL}${block.publicUrl}`;
  }

  if (block.storageKey) {
    return `${FILE_BASE_URL}/uploads/${block.storageKey}`;
  }

  return "";
};


/* ✅ FIX: prevent duplicate blocks */
const upsertBlock = (setBlocks, newBlock) => {
  setBlocks(prev => {
    const index = prev.findIndex(b => b.type === newBlock.type);

    if (index !== -1) {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...newBlock };
      return updated;
    }

    return [...prev, newBlock];
  });
};

/* ================= SORTABLE ITEM ================= */
function SortableItem({ id, renderField, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ddd",
    padding: "15px",
    marginBottom: "15px",
    background: "#fff",
    position: "relative"
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          border: "1px solid #f5f5f5",
          padding: "6px 10px",
          marginBottom: "10px",
          display: "inline-block",
          borderRadius: "4px",
          fontSize: "13px"
        }}
      >
        ☰
      </div>

      <button
        type="button"
        onClick={() => onRemove(id)}
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "16px",
          color: "#c00"
        }}
      >
        ×
      </button>

      {renderField(id)}
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function ModuleLessons() {
  const { courseId, moduleId } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [editId, setEditId] = useState(null);

  const [selectedType, setSelectedType] = useState("");

  const [form, setForm] = useState({
    title: "",
    summary: "",
    type: "",
    sourceType: "external_url",
    publicUrl: "",
    textContent: "",
    order: 1,
    storageKey: "",
    fileName: "",
    mimeType: "",
    fileSize: 0
  });

  const [filePreview, setFilePreview] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [activeTab, setActiveTab] = useState("addLesson");
  const [loading, setLoading] = useState(false);
  const [canvasFields, setCanvasFields] = useState([]);

  const sensors = useSensors(useSensor(PointerSensor));
  const sidebarFields = [
    { id: "title", label: "Lesson Title" },
    { id: "video", label: "Add Video" },
    { id: "image", label: "Add Image" },
    { id: "pdf", label: "Add PDF" },
    { id: "text", label: "Add Text" },
    { id: "order", label: "Display Order" }
  ];

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = canvasFields.indexOf(active.id);
    const newIndex = canvasFields.indexOf(over.id);

    const items = [...canvasFields];
    items.splice(oldIndex, 1);
    items.splice(newIndex, 0, active.id);

    setCanvasFields(items);
  }

  const loadLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/courses/${courseId}/modules/${moduleId}/lessons?active=true&page=1&limit=100`
      );
      setLessons(res.data.lessons || []);
    } catch {
      toastr.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* ================= FILE UPLOAD ================= */
  const uploadFile = async (file, type) => {
    const finalType = type || form.type;

    if (!file || !finalType) return;

    const previewUrl = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/uploads/lessons/file/${finalType}`, formData);

      const newBlock = {
        type: finalType,
        sourceType: "stored_file",
        publicUrl: res.data.publicUrl,
        storageKey: res.data.storageKey,
        fileName: res.data.fileName,
        mimeType: res.data.mimeType,
        fileSize: res.data.fileSize,
        preview: previewUrl // ✅ FIX
      };

      upsertBlock(setBlocks, newBlock);

      setUploadedFileName(res.data.fileName);
      toastr.success("Uploaded");
    } catch {
      toastr.error("Upload failed");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async e => {
    e.preventDefault();

    if (blocks.length === 0) {
      return toastr.warning("Add at least one block");
    }

    const payload = {
      title: form.title,
      order: Number(form.order),
      blocks: blocks.map((b, index) => ({
        type: b.type,
        order: index + 1,
        sourceType: b.sourceType,
        contentText: b.contentText || "",
        contentUrl: b.sourceType === "external_url" ? b.publicUrl : undefined,
        publicUrl: b.sourceType === "stored_file" ? b.publicUrl : undefined,
        storageKey: b.storageKey || "",
        fileName: b.fileName || "",
        mimeType: b.mimeType || "",
        fileSize: b.fileSize || 0
      })),
      active: true
    };

    try {
      if (editId) {
        await api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${editId}`, payload);
      } else {
        await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, payload);
      }

      setBlocks([]);
      setCanvasFields([]);
      setForm({
        title: "",
        publicUrl: "",
        textContent: "",
        order: 1
      });

      setEditId(null);
      setFilePreview("");
      setSelectedType("");

      loadLessons();
      setActiveTab("lessonList");
    } catch {
      toastr.error("Save failed");
    }
  };

  /* ================= RENDER FIELD ================= */
  function renderField(id) {
const currentBlock = blocks.filter(b => b.type === id).slice(-1)[0];
    switch (id) {
      case "title":
        return (
          <div className="form-group">
            <label>Lesson Title</label>
            <input name="title" value={form.title} onChange={handleChange} />
          </div>
        );

      case "video":
case "image":
case "pdf":
  return (
    <>
      <h3 className="not-tl">
        {id === "video" ? "Add Video" : id === "image" ? "Add Image" : "Add PDF"}
      </h3>

      {/* URL INPUT */}
      <div className="form-group">
        <label>Content URL</label>
        <input
          type="text"
          name="publicUrl"
          value={form.publicUrl}
          onChange={e => {
            const url = e.target.value;

            setSelectedType(id);

            upsertBlock(setBlocks, {
              type: id,
              sourceType: "external_url",
              publicUrl: url
            });

            setForm(prev => ({
              ...prev,
              publicUrl: url,
              type: id,
              sourceType: "external_url"
            }));
          }}
        />
      </div>

      {/* FILE UPLOAD */}
      <div className="form-group">
        <label>Upload File</label>
        <input
          type="file"
          accept={id === "pdf" ? "application/pdf" : "*"}
          onChange={e => {
            setSelectedType(id);
            setForm(prev => ({ ...prev, type: id }));
            uploadFile(e.target.files[0], id);
          }}
        />

        {/* ✅ VIDEO PREVIEW */}
        {currentBlock?.preview && id === "video" && (
          <div style={{ marginTop: "10px" }}>
            <video width="100%" controls src={currentBlock?.preview} />
          </div>
        )}

        {/* ✅ IMAGE PREVIEW */}
        {currentBlock?.preview && id === "image" && (
          <div style={{ marginTop: "10px" }}>
            <img width="100%" src={currentBlock?.preview} alt="" />
          </div>
        )}

        {/* ✅ PDF PREVIEW */}
        {currentBlock?.preview && id === "pdf" && (
          <div style={{ marginTop: "10px" }}>
            <iframe
              src={currentBlock?.preview}
              width="200"
              height="120"
              title="PDF Preview"
            />
          </div>
        )}

        {/* ✅ FILE NAME DISPLAY (PDF etc) */}
        {(currentBlock?.fileName) && (
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#f5f5f5",
              padding: "8px 10px",
              borderRadius: "6px"
            }}
          >
            <i
              className="fa fa-file"
              style={{ color: "#333", fontSize: "16px" }}
            ></i>

            <span style={{ fontSize: "14px" }}>
              {currentBlock?.fileName}
            </span>
          </div>
        )}
      </div>
    </>
  );

      case "text":
        return (
          <>
            <h3 className="not-tl">Add Description</h3>
            <ReactQuill
              value={form.textContent}
              onChange={val => {
                upsertBlock(setBlocks, {
                  type: "text",
                  sourceType: "inline",
                  contentText: val
                });

                setForm(prev => ({ ...prev, textContent: val }));
              }}
            />
          </>
        );

      case "order":
        return (
          <div className="form-group">
            <label>Display Order</label>
            <input name="order" value={form.order} onChange={handleChange} />
          </div>
        );

      default:
        return null;
    }
  }
const handleEdit = (lesson) => {
  setEditId(lesson._id);

  const blocksData = lesson.blocks || [];

  // Fix URLs
  const fixedBlocks = blocksData.map(b => ({
    ...b,
    publicUrl: b.publicUrl
      ? (b.publicUrl.startsWith("http")
          ? b.publicUrl
          : `${FILE_BASE_URL}${b.publicUrl}`)
      : b.storageKey
      ? `${FILE_BASE_URL}/uploads/${b.storageKey}`
      : ""
  }));

  setBlocks(fixedBlocks);

  // Fill form
  setForm({
    title: lesson.title,
    order: lesson.order,
    publicUrl: "",
    textContent: ""
  });

  // Restore canvas layout
  setCanvasFields([
    "title",
    ...blocksData.map(b => b.type),
    "order"
  ]);

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
  /* ================= RENDER ================= */
  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">LESSON</h1>
        <p className="wlc-ms">Please add your lesson's and take a look at lessons.</p>
      </div>

      <div className="pg-tabs">
        <span className={`pg-tb ${activeTab === "addLesson" ? "active-tab" : ""}`} onClick={() => setActiveTab("addLesson")}>
          Add Lesson
        </span>
        <span className={`pg-tb ${activeTab === "lessonList" ? "active-tab" : ""}`} onClick={() => setActiveTab("lessonList")}>
          Lesson List
        </span>
      </div>

      <div className="tab-content">
        {activeTab === "addLesson" && (
          <div className="tab-cnnt">
            <div style={{ display: "flex", gap: "30px" }}>
              <div style={{ flex: 1 }}>
                <form onSubmit={handleSubmit}>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={canvasFields} strategy={verticalListSortingStrategy}>
                      {canvasFields.map(id => (
                        <SortableItem key={id} id={id} renderField={renderField} onRemove={f => setCanvasFields(prev => prev.filter(x => x !== f))} />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <button type="submit" className="snd-btn">Save</button>
                </form>
              </div>

              <div style={{ width: "300px" }}>
                {sidebarFields.map(field => (
  <div
    className="les-typ"
    key={field.id}
    onClick={() => {
      if (!canvasFields.includes(field.id)) {
        setCanvasFields(prev => [...prev, field.id]);
      }

      if (["video", "image", "pdf", "text"].includes(field.id)) {
        // ✅ RESET OLD DATA (THIS FIXES YOUR BUG)
        setSelectedType(field.id);

        setForm(prev => ({
          ...prev,
          type: field.id,
          publicUrl: "",
          textContent: ""
        }));

        setFilePreview("");        // ❌ remove previous preview
        setUploadedFileName("");   // ❌ remove previous file name
      }
    }}
  >
    <i className="fa-solid fa-grip-vertical"></i> {field.label}
  </div>
))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "lessonList" && (
          <div className="ls-tbl">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Preview</th>
                  <th>Order</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map(lesson => (
                  <tr key={lesson._id}>
                    <td>{lesson.title}</td>
                    <td>{lesson.blocks?.map(b => b.type).join(", ")}</td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {lesson.blocks?.map((block, i) => {
                          const fileUrl = getFileUrl(block);

                          return (
                            <div key={i}>
                              {block.type === "video" ? (
                                <video width="200" controls>
                                  <source src={fileUrl} />
                                </video>
                              ) : block.type === "image" ? (
                                <img src={fileUrl} width="150" alt="" />
                              ) : block.type === "pdf" ? (
                                <iframe src={fileUrl} width="200" height="120" />
                              ) : (
                                <div dangerouslySetInnerHTML={{ __html: block.contentText }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td>{lesson.order}</td>

                    <td>
                      <div className="act-btns">
                        <span className="logout-btn" onClick={() => handleEdit(lesson)}>
                          <i className="fa fa-edit"></i>
                        </span>
                        <span className="logout-btn" onClick={() => handleDelete(lesson._id)}>
                          <i className="fa fa-trash"></i>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}