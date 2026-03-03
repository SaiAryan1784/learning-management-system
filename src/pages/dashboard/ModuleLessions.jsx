import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function ModuleLessons() {
  const { courseId, moduleId } = useParams();
  const tableRef = useRef();

  const [lessons, setLessons] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "video",
    sourceType: "external_url",
    contentUrl: "",
    textContent: "",
    order: 1,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const [activeTab, setActiveTab] = useState("addLesson"); // tabs
  const [loading, setLoading] = useState(false);

  // ================= LOAD LESSONS =================
  const loadLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/courses/${courseId}/modules/${moduleId}/lessons?active=true&page=1&limit=100`
      );
      setLessons(res.data.lessons || []);
    } catch (err) {
      toastr.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  // ================= DATA TABLE REFRESH =================
  useEffect(() => {
    if (activeTab === "lessonList" && lessons.length > 0 && !loading) {
      if ($.fn.DataTable.isDataTable("#lessonsTable")) {
        $("#lessonsTable").DataTable().destroy();
      }

      setTimeout(() => {
        $("#lessonsTable").DataTable({
          pageLength: 5,
          lengthMenu: [5, 10, 25],
        });
      }, 0);
    }
  }, [activeTab, lessons, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // ================= UPLOAD FILE =================
  const uploadFile = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress(0);

      let presignRes;
      try {
        presignRes = await api.post("/uploads/lessons/presign", {
          fileName: file.name,
          mimeType: file.type,
        });
      } catch (err) {
        presignRes = null;
      }

      if (presignRes && presignRes.data.uploadUrl) {
        const { uploadUrl, fileUrl } = presignRes.data;

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };
        xhr.onload = () => {
          setUploading(false);
          setUploadedFileName(file.name);
          setForm((prev) => ({
            ...prev,
            contentUrl: fileUrl,
            sourceType: "file",
          }));
          toastr.success("Upload successful to S3");
        };
        xhr.onerror = () => {
          setUploading(false);
          toastr.error("Upload failed to S3");
        };
        xhr.send(file);
      } else {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await api.post(
          `/uploads/lessons/file/${form.type}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (event) => {
              if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
              }
            },
          }
        );

        setUploading(false);
        setUploadedFileName(file.name);
        setForm((prev) => ({
          ...prev,
          contentUrl: uploadRes.data.fileUrl,
          sourceType: "file",
        }));
        toastr.success("Upload successful to server");
      }
    } catch (err) {
      setUploading(false);
      toastr.error("Upload error");
      console.error(err);
    }
  };

  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const match = url.match(reg);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (uploading) return toastr.warning("Wait for upload");

  const payload = {
    title: form.title,
    type: form.type,
    order: Number(form.order),
    sourceType: form.sourceType,
  };

  if (form.type === "text") {
    payload.contentText = form.textContent;
  } else {
    payload.contentUrl = form.contentUrl;
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

    setEditId(null);
    setUploadedFileName("");
    setForm({
      title: "",
      type: "video",
      sourceType: "external_url",
      contentUrl: "",
      textContent: "",
      order: 1,
    });

    loadLessons();
    setActiveTab("lessonList");
  } catch (err) {
    console.error(err.response?.data || err);
    toastr.error(err.response?.data?.message || "Save failed");
  }
};

  const handleEdit = (lesson) => {
    setEditId(lesson._id);
    setForm({
      title: lesson.title || "",
      type: lesson.type || "video",
      sourceType: lesson.sourceType || "external_url",
      contentUrl: lesson.contentUrl || "",
      textContent: lesson.type === "text" ? lesson.contentText || "" : "",
      order: lesson.order || 1,
    });
    setActiveTab("addLesson");
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">LESSON</h1>
        <p className="wlc-ms">Please add your lesson's and take a look at lessons.</p>
      </div>

      <div className="pg-tabs">
        <span
          className={`pg-tb ${activeTab === "addLesson" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("addLesson")}
        >
          Add Lesson
        </span>
        <span
          className={`pg-tb ${activeTab === "lessonList" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("lessonList")}
        >
          Lesson List
        </span>
      </div>

      <div className="tab-content">
        {activeTab === "addLesson" && (
          <div className="tab-cnnt">
            <Link to="/dashboard/courses" className="logout-btn">
              <i className="fa-solid fa-arrow-left"></i>
              <span className="tooltiptext">Back to courses</span>
            </Link>
            <div className="saas-container">
  <div className="saas-card">
    <div className="saas-header">
      <h2>{editId ? "Edit Lesson" : "Create New Lesson"}</h2>
      <p>Fill in the details below to add your lesson content.</p>
    </div>

    <form onSubmit={handleSubmit} className="saas-form">

      {/* Lesson Info */}
      <div className="form-section">
        <h4>Lesson Information</h4>

        <div className="form-group">
          <label>Lesson Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter lesson title"
            required
          />
        </div>

        <div className="form-group">
          <label>Lesson Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="text">Text</option>
          </select>
        </div>
      </div>

      {/* Content Section */}
      {form.type !== "text" && (
        <div className="form-section">
          <h4>Content Source</h4>

          <div className="form-group">
            <label>Source Type</label>
            <select
              name="sourceType"
              value={form.sourceType}
              onChange={handleChange}
            >
              <option value="external_url">External URL</option>
              <option value="file">Upload File</option>
            </select>
          </div>

          {form.sourceType === "external_url" ? (
            <div className="form-group">
              <label>Content URL</label>
              <input
                type="text"
                name="contentUrl"
                value={form.contentUrl}
                onChange={handleChange}
                placeholder="https://example.com/video"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Upload File</label>
              <input
                type="file"
                onChange={(e) => uploadFile(e.target.files[0])}
              />
            </div>
          )}

          {uploading && (
            <div className="progress-wrapper">
              <div
                className="progress-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {uploadedFileName && (
            <small className="success-text">
              Uploaded: {uploadedFileName}
            </small>
          )}
        </div>
      )}

      {/* Text Editor */}
      {form.type === "text" && (
        <div className="form-section">
          <h4>Lesson Content</h4>
          <ReactQuill
            value={form.textContent}
            onChange={(value) =>
              setForm({ ...form, textContent: value })
            }
          />
        </div>
      )}

      {/* Settings */}
      <div className="form-section">
        <h4>Lesson Settings</h4>

        <div className="form-group">
          <label>Display Order</label>
          <input
            type="number"
            name="order"
            value={form.order}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-footer">
        <button
          type="submit"
          disabled={uploading}
          className="snd-btn"
        >
          {editId ? "Update Lesson" : "Create Lesson"}
        </button>
      </div>

    </form>
  </div>
</div>
          </div>
        )}

        {activeTab === "lessonList" && (
          <div className="ls-tbl">
            {loading ? (
              <p>Loading lessons...</p>
            ) : (
              <table id="lessonsTable" className="dataTable" ref={tableRef}>
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
                  {lessons.length == 0 && 
                  <tr><td colspan="5">No Lessons created</td></tr>
                  }
                  {lessons.map((lesson) => (
                    <tr key={lesson._id}>
                      <td>{lesson.title}</td>
                      <td>{lesson.type}</td>
                      <td>
                        {lesson.type === "video" && lesson.sourceType === "external_url" ? (
                          <iframe
                            width="200"
                            height="120"
                            src={getYouTubeEmbed(lesson.contentUrl)}
                          />
                        ) : lesson.type === "video" ? (
                          <video width="200" controls>
                            <source src={lesson.contentUrl} />
                          </video>
                        ) : lesson.type === "image" ? (
                          <img src={lesson.contentUrl} width="150" alt="" />
                        ) : lesson.type === "pdf" ? (
                          <a href={lesson.contentUrl} target="_blank" rel="noreferrer">
                            View PDF
                          </a>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: lesson.contentText }} />
                        )}
                      </td>
                      <td>{lesson.order}</td>
                      <td>
                        <button
                          className="logout-btn"
                          onClick={() => handleEdit(lesson)}
                        >
                          <i className="fa fa-edit"></i>
                          <span className="tooltiptext">Edit Lesson</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
