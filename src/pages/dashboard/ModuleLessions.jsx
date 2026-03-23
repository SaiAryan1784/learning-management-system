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

/* ================= HELPER ================= */
const getFileUrl = (block) => {
  if (!block) return "";
  if (block.sourceType === "external_url") return block.contentUrl || "";
  if (block.storageKey) return `${BASE_URL}/${block.storageKey}`;
  return "";
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
    contentUrl: "",
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

  /* ================= SIDEBAR UPDATED ================= */
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
  /* ================= LOAD ================= */
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

  /* ================= CHANGE ================= */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* ================= FILE UPLOAD ================= */
  const uploadFile = async file => {
  if (!file) return;

  setFilePreview(URL.createObjectURL(file));
  setUploading(true);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post(`/uploads/lessons/file/${form.type}`, formData);

    const newBlock = {
      type: form.type,
      sourceType: "stored_file",
      contentUrl: res.data.fileUrl,
      storageKey: res.data.storageKey || "",   // ✅ FIX
      fileName: res.data.fileName || file.name,
      mimeType: res.data.mimeType || file.type,
      fileSize: res.data.fileSize || file.size
    };

    setBlocks(prev => {
  const others = prev.filter(b => b.type !== form.type);
  return [...others, newBlock];
});

    setForm(prev => ({
      ...prev,
      contentUrl: res.data.fileUrl,
      sourceType: "file",
      storageKey: newBlock.storageKey,
      fileName: newBlock.fileName,
      mimeType: newBlock.mimeType,
      fileSize: newBlock.fileSize
    }));

    setUploadedFileName(file.name);
    toastr.success("Uploaded");
  } catch {
    toastr.error("Upload failed");
  } finally {
    setUploading(false);
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
      ...b,
      order: index + 1
    })),
    active: true
  };

  try {
    if (editId) {
      await api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${editId}`, payload);
      toastr.success("Updated");
    } else {
      await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, payload);
      toastr.success("Created");
    }

    // reset
    setForm({
      title: "",
      type: "",
      contentUrl: "",
      textContent: "",
      order: 1
    });

    setBlocks([]);
    setCanvasFields([]);
    setFilePreview("");
    setSelectedType("");

    loadLessons();
    setActiveTab("lessonList");
  } catch (err) {
    toastr.error(err.response?.data?.error || "Save failed");
  }
};

 /* ✅ FIXED EDIT (text handling) */
  const handleEdit = lesson => {
    setEditId(lesson._id);

    const blocksData = lesson.blocks || [];

    setBlocks(blocksData);

   const firstMedia = blocksData.find(b => b.type !== "text");

setForm({
  title: lesson.title,
  textContent: blocksData.find(b => b.type === "text")?.contentText || "",
  contentUrl:
    firstMedia?.sourceType === "external_url"
      ? firstMedia.contentUrl
      : "",
  order: lesson.order
});

    setCanvasFields([
      "title",
      ...blocksData.map(b => b.type),
      "order"
    ]);

    setActiveTab("addLesson");
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${id}`);
    loadLessons();
  };

  /* ================= RENDER FIELD ================= */
  function renderField(id) {
    switch (id) {
      case "title":
        return (
          <div className="form-group">
            <label>Lesson Title</label>
            <input name="title" value={form.title} onChange={handleChange} />
          </div>
        );

      case "video":
        return (
            <>
            <h3 className="not-tl">Add Video</h3>
            <div className="form-group">
            <label>Content URL</label>
            <input
                type="text"
                name="contentUrl"
                value={form.contentUrl}
                onChange={e => {
  const url = e.target.value;

  setSelectedType(id);

  const newBlock = {
    type: id,
    sourceType: "external_url",
    contentUrl: url
  };

  setBlocks(prev => {
    const others = prev.filter(b => b.type !== id);
    return [...others, newBlock];
  });

  setForm(prev => ({
    ...prev,
    type: id,
    contentUrl: url,
    sourceType: "external_url"
  }));
}}
            />
        </div>
          <div className="form-group">
            
           <label>Upload File</label>
            <input
              type="file"
              onChange={e => {
                setSelectedType(id);
                setForm(prev => ({ ...prev, type: id }));
                uploadFile(e.target.files[0]);
              }}
            />
          </div>
          </>
        );
    case "image":
        return (
            <>
            <h3 className="not-tl">Add Image</h3>
            <div className="form-group">
            <label>Content URL</label>
            <input
                type="text"
                name="contentUrl"
                value={form.contentUrl}
                onChange={e => {
  const url = e.target.value;

  setSelectedType(id);

  const newBlock = {
    type: id,
    sourceType: "external_url",
    contentUrl: url
  };

  setBlocks(prev => {
    const others = prev.filter(b => b.type !== id);
    return [...others, newBlock];
  });

  setForm(prev => ({
    ...prev,
    type: id,
    contentUrl: url,
    sourceType: "external_url"
  }));
}}
            />
        </div>
          <div className="form-group">
            
           <label>Upload File</label>
            <input
              type="file"
              onChange={e => {
                setSelectedType(id);
                setForm(prev => ({ ...prev, type: id }));
                uploadFile(e.target.files[0]);
              }}
            />
          </div>
          </>
        );
        case "pdf":
        return (
            <>
            <h3 className="not-tl">Add PDF</h3>
            <div className="form-group">
            <label>Content URL</label>
            <input
                type="text"
                name="contentUrl"
                value={form.contentUrl}
                onChange={e => {
  const url = e.target.value;

  setSelectedType(id);

  const newBlock = {
    type: id,
    sourceType: "external_url",
    contentUrl: url
  };

  setBlocks(prev => {
    const others = prev.filter(b => b.type !== id);
    return [...others, newBlock];
  });

  setForm(prev => ({
    ...prev,
    type: id,
    contentUrl: url,
    sourceType: "external_url"
  }));
}}
            />
        </div>
          <div className="form-group">
            
           <label>Upload File</label>
            <input
              type="file"
              onChange={e => {
                setSelectedType(id);
                setForm(prev => ({ ...prev, type: id }));
                uploadFile(e.target.files[0]);
              }}
            />
          </div>
          </>
        );
      case "text":
        return (
            <>
            <h3 className="not-tl">Add Description</h3>
          <div className="form-group">
            <label>Lesson Content</label>
            <ReactQuill
              value={form.textContent}
              onChange={val => {
                setSelectedType("text");

                const newBlock = {
                    type: "text",
                    sourceType: "inline",
                    contentText: val
                };

                setBlocks(prev => {
                    const others = prev.filter(b => b.type !== "text");
                    return [...others, newBlock];
                });

                setForm(prev => ({ ...prev, textContent: val, type: "text" }));
                }}
            />
          </div>
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

  /* ================= RENDER ================= */
  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">LESSON</h1>
        <p className="wlc-ms">Please add your lesson's and take a look at lessons.</p>
      </div>

      <div className="pg-tabs">
        <span className={`pg-tb ${activeTab === "addLesson" ? "active-tab" : ""}`} onClick={() => setActiveTab("addLesson")}>
          {editId ? "Update Lesson" : "Add Lesson"}
        </span>
        <span className={`pg-tb ${activeTab === "lessonList" ? "active-tab" : ""}`} onClick={() => setActiveTab("lessonList")}>
          Lesson List
        </span>
      </div>

      <div className="tab-content">
        {activeTab === "addLesson" && (
          <div className="tab-cnnt">
            <div style={{ display: "flex", gap: "30px" }}>
              <div style={{ flex: 1, border: "1px solid #ddd", padding: "20px", position: "relative" }}>
                <form onSubmit={handleSubmit}>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={canvasFields} strategy={verticalListSortingStrategy}>
                      {canvasFields.map(id => (
                        <SortableItem key={id} id={id} renderField={renderField} onRemove={f => setCanvasFields(prev => prev.filter(x => x !== f))} />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <button type="submit" className="snd-btn">
                    {editId ? "Update Lesson" : "Create Lesson"}
                  </button>
                </form>
              </div>

              <div style={{ width: "300px", border: "1px solid #ddd", padding: "15px" }}>
                <p className="no-not mb-2">Please click on below option to add lesson</p>
                {sidebarFields.map(field => (
                  <div
                    className="les-typ"
                    key={field.id}
                    onClick={() => {
                      if (!canvasFields.includes(field.id)) {
                        setCanvasFields(prev => [...prev, field.id]);
                        if (["video", "image", "pdf", "text"].includes(field.id)) {
                          setSelectedType(field.id);
                          setForm(prev => ({ ...prev, type: field.id }));
                        }
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
                {lessons.map(lesson => {
                  const block = lesson.blocks?.[0] || {};
                  const fileUrl = getFileUrl(block);

                  return (
                    <tr key={lesson._id}>
                      <td>{lesson.title}</td>
                      <td>{block.type}</td>
                      <td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}