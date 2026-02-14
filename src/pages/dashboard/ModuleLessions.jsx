import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function ModuleLessons() {
  const { courseId, moduleId } = useParams();

  const [lessons, setLessons] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "video",
    order: 1,
    contentText: "",
  });

  const [file, setFile] = useState(null);
  const [uploadData, setUploadData] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // ---------------- LOAD LESSONS ----------------
  const loadLessons = async () => {
    try {
      if ($.fn.DataTable.isDataTable("#lessonsTable")) {
        $("#lessonsTable").DataTable().destroy();
      }

      const res = await api.get(
        `/courses/${courseId}/modules/${moduleId}/lessons`
      );

      setLessons(res.data.lessons || []);
    } catch {
      toastr.error("Failed to load lessons");
    }
  };

  useEffect(() => {
    loadLessons();
  }, [courseId, moduleId]);

  useEffect(() => {
    if (lessons.length > 0) {
      setTimeout(() => {
        $("#lessonsTable").DataTable();
      }, 100);
    }
  }, [lessons]);

  // ---------------- DRAG DROP ----------------
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = async () => {
    if (!file) return toastr.error("Select file first");

    try {
      const presign = await api.post("/uploads/lessons/presign", {
        lessonType: form.type,
        fileName: file.name,
        mimeType: file.type,
      });

      const { uploadUrl, publicUrl, storageKey } = presign.data;

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // ✅ Correct backend contract
      setUploadData({
        sourceType: "file",
        contentUrl: publicUrl,
        storageKey,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      toastr.success("File uploaded successfully");
    } catch {
      toastr.error("Upload failed");
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!form.title.trim())
      return toastr.error("Lesson title required");

    let payload = {
      title: form.title,
      type: form.type,
      order: form.order,
    };

    if (form.type === "text") {
      payload.contentText = form.contentText;
    } else {
      if (!uploadData)
        return toastr.error("Upload file first");

      payload = { ...payload, ...uploadData };
    }

    try {
      if (editId) {
        await api.put(
          `/courses/${courseId}/modules/${moduleId}/lessons/${editId}`,
          payload
        );
        toastr.success("Lesson updated");
      } else {
        await api.post(
          `/courses/${courseId}/modules/${moduleId}/lessons`,
          payload
        );
        toastr.success("Lesson added");
      }

      resetForm();
      loadLessons();
    } catch (err) {
      console.log(err);
      toastr.error(err.response?.data?.error || "Error saving lesson");
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (l) => {
    setEditId(l.id || l._id);

    setForm({
      title: l.title,
      type: l.type,
      order: l.order,
      contentText: l.contentText || "",
    });

    if (l.type !== "text") {
      setUploadData({
        sourceType: "file",
        contentUrl: l.contentUrl,
        storageKey: l.storageKey,
        fileName: l.fileName,
        mimeType: l.mimeType,
        fileSize: l.fileSize,
      });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      title: "",
      type: "video",
      order: 1,
      contentText: "",
    });
    setFile(null);
    setUploadData(null);
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">LESSON'S</h1>
        <p className="wlc-ms">
          Please add lesson's and take a look at your business.
        </p>
      </div>

      {/* FORM */}
      <div className="frm-cntr">
        <Link
          className="logout-btn"
          to={`/dashboard/courses/${courseId}/modules`}
        >
          <i className="fa-solid fa-arrow-left"></i> Modules
        </Link>

        <h2 className="sc-tl">
          {editId ? "Edit Lesson" : "Add Lesson"}
        </h2>

        <input
          className="login-ip"
          placeholder="Lesson Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <select
          className="login-ip"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
        >
          <option value="video">Video</option>
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
          <option value="text">Text</option>
        </select>

        {form.type === "text" ? (
          <textarea
            className="login-ip"
            placeholder="Lesson Content"
            value={form.contentText}
            onChange={(e) =>
              setForm({ ...form, contentText: e.target.value })
            }
          />
        ) : (
          <>
            {/* DRAG DROP UI (your style kept) */}
            <div
              className="login-ip file-up"
              style={{
                background: dragActive ? "#eef6ff" : "transparent",
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById("fileInput").click()
              }
            >
              {file ? (
                <p>{file.name}</p>
              ) : (
                <p>
                    <i className="fa-solid fa-file-upload fa-2x"></i>
                  Drag & Drop file here or Click to Upload
                </p>
              )}
              <input
                id="fileInput"
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <button
              className="snd-btn"
              type="button"
              onClick={handleFileUpload}
            >
              Upload File
            </button>

            {uploadData && (
              <p style={{ color: "green", margin: "10px 0" }}>
                Uploaded: {uploadData.fileName}
              </p>
            )}
          </>
        )}

        <input
          type="number"
          className="login-ip"
          placeholder="Order"
          value={form.order}
          onChange={(e) =>
            setForm({ ...form, order: e.target.value })
          }
        />

        <button className="snd-btn" onClick={handleSubmit}>
          {editId ? "Update" : "Add"}
        </button>

        {editId && (
          <button
            className="snd-btn"
            style={{ marginLeft: "10px" }}
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </div>

     {lessons.length === 0 ? (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
            No lessons available. Please add a lesson for this module.
          </h3>
        </div>
      ) : (
        <table
          id="lessonsTable"
          border="1"
          cellPadding="10"
          cellSpacing="0"
          width="100%"
        >
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Type</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l, i) => (
              <tr key={l.id || l._id}>
                <td>{i + 1}</td>
                <td>
                  {l.thumbnailUrl ? (
                    <img
                      src={l.thumbnailUrl}
                      alt="thumb"
                      width="60"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{l.title}</td>
                <td>{l.type}</td>
                <td>{l.order}</td>
                <td>
                  <span
                    className="logout-btn"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEdit(l)}
                  >
                    <i className="fa fa-edit"></i>
                    <span className="tooltiptext">Edit lesson</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
