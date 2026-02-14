import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function OSCourse() {
  const tableRef = useRef();
  const dtRef = useRef();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("draft");

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    status: "draft",
  });

  const [editId, setEditId] = useState(null);

  // ---------------- LOAD DATA ----------------
  const loadCategories = async () => {
    try {
      const res = await api.get("/course-categories?active=true&page=1&limit=100");
      setCategories(res.data.categories || []);
    } catch {
      toastr.error("Error loading categories");
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Error loading courses");
    }
  };

  useEffect(() => {
    loadCategories();
    loadCourses();
  }, []);

  // ---------------- DATATABLE ----------------
  useEffect(() => {
    const filtered = courses.filter((c) => c.status === activeTab);

    if (dtRef.current) {
      dtRef.current.clear().rows.add(filtered).draw();
      return;
    }

    dtRef.current = $(tableRef.current).DataTable({
      data: filtered,
      destroy: true,
      columns: [
        {
          data: null,
          render: (data, type, row, meta) => meta.row + 1,
        },
        { data: "title" },
        {
          data: null,
          render: (data) => {
            const catId = data.categories?.[0];
            const cat = categories.find((c) => c._id === catId);
            return cat?.name || "";
          },
        },
        { data: "status" },
        {
          data: null,
          orderable: false,
          render: () => `
            <div class="act-btns">
              <span class="logout-btn edit-btn">
                <i class="fa fa-edit"></i>
                <span class="tooltiptext">Edit course</span>
              </span>

              <span class="logout-btn module-btn" style="margin-left:8px;">
                <i class="fa fa-book"></i>
                <span class="tooltiptext">Add course module</span>
              </span>

              <span class="logout-btn assign-btn" style="margin-left:8px;">
                <i class="fa fa-user-plus"></i>
                <span>Assign course to staff</span>
              </span>
            </div>
          `,
        },
      ],
    });

    // -------- EDIT CLICK --------
    $(tableRef.current).on("click", ".edit-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      handleEdit(rowData);
    });

    // -------- MODULE CLICK --------
    $(tableRef.current).on("click", ".module-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      window.location.href = `/dashboard/courses/${rowData._id}/modules`;
    });

    // -------- ASSIGN STAFF CLICK --------
    $(tableRef.current).on("click", ".assign-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      window.location.href = `/dashboard/courses/${rowData._id}/assign`;
    });
  }, [courses, categories, activeTab]);

  // ---------------- FORM SUBMIT ----------------
  const handleSubmit = async () => {
    if (!form.title) return toastr.error("Title required");
    if (!form.categoryId) return toastr.error("Select category");

    const body = {
      title: form.title,
      description: form.description,
      categoryIds: [form.categoryId],
    };

    try {
      if (editId) {
        await api.put(`/courses/${editId}`, body);
        toastr.success("Course updated");
      } else {
        await api.post("/courses", body);
        toastr.success("Course added");
      }

      resetForm();
      loadCourses();
    } catch {
      toastr.error("Error saving course");
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (c) => {
    setEditId(c._id);
    setForm({
      title: c.title,
      description: c.description,
      categoryId: c.categories?.[0]?._id || "",
      status: c.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      title: "",
      description: "",
      categoryId: "",
      status: "draft",
    });
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">COURSE'S</h1>
        <p className="wlc-ms">
          Please add your courses's and take a look at your business.
        </p>
      </div>

      {/* FORM */}
      <div className="frm-cntr">
        <Link className="logout-btn" to="/dashboard"><i className="fa-solid fa-arrow-left"></i></Link>

        <h2 className="sc-tl">{editId ? "Edit Course" : "Add Course"}</h2>

        <input
          className="login-ip"
          placeholder="Course Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          className="login-ip"
          placeholder="Description"
          value={form.description}
          rows="6"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <select
          className="login-ip"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <select
          className="login-ip"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

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

      {/* TABS */}
      <div className="pg-tabs">
        <span
          className={`pg-tb ${activeTab === "draft" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("draft")}
        >
          Draft
        </span>
        <span
          className={`pg-tb ${activeTab === "published" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("published")}
        >
          Published
        </span>
      </div>

      {/* TABLE */}
      <table
        ref={tableRef}
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  );
}
