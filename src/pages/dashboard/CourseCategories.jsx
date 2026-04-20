import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";

export default function CourseCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);

  // ✅ Load Categories
  const loadCategories = async () => {
    try {
      if ($.fn.DataTable.isDataTable("#catTable")) {
        $("#catTable").DataTable().destroy();
      }

      const res = await api.get("/course-categories?active=true&page=1&limit=20");
      setCategories(res.data.categories || []);
    } catch (err) {
      toastr.error("Failed to load categories", "error");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ✅ Apply DataTable
  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(() => {
        $("#catTable").DataTable();
      }, 0);
    }
  }, [categories]);

  // ✅ Add / Update Category
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toastr.error("Category name is required", "error");
      return;
    }

    try {
      if (editId) {
        await api.put(`/course-categories/${editId}`, {
          name: form.name,
          description: form.description,
          active: true,
        });
        toastr.success("Category updated successfully", "success");
      } else {
        await api.post("/course-categories", form);
        toastr.success("Category created successfully", "success");
      }

      resetForm();
      setOpenPop(false);
      loadCategories();
    } catch (err) {
      toastr.error("Something went wrong", "error");
    }
  };

  // ✅ Edit
  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description,
    });
    setEditId(cat._id);
      setOpenPop(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditId(null);
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">COURSE CATEGORY</h1>
        <p className="wlc-ms">Please add the course categorie's and take a look at your business.</p>
      </div>
      <div className="tp-sc">
        <span className="logout-btn" 
        onClick={() => {
          resetForm();
          setOpenPop(true);
        }}><i className="fa-solid fa-plus"></i>
          <span className="tooltiptext">Add Course Category</span></span>
          <Link to="/dashboard/courses" class="btn btn-sm" style={{"color": "rgb(5, 150, 105)","border": "1px solid #059669",
    "marginTop": "10px"}}>Click To Add Course</Link>
        <Link to="/dashboard" className="logout-btn">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
      </div>
      {/* Form */}
      <div className={`frm-cntr ${openPop ? "open" : ""}`}>
        <span className="logout-btn"
          onClick={() => {
            setOpenPop(false);
            resetForm();
          }}
        >
          <i className="fa-solid fa-close"></i>
        </span>

        <h2 className="sc-tl">
          {editId ? "Edit Course Category" : "Add Course Category"}
        </h2>

        <input
          className="login-ip"
          placeholder="Category Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          className="login-ip"
          placeholder="Description"
          rows="5"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
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

      {/* Table */}
      <table
        id="catTable"
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No categories found
              </td>
            </tr>
          ) : (
            categories.map((c, i) => (
              <tr key={`${c.id || c._id}-${i}`}>
                <td>{c.name}</td>
                <td>{c.description}</td>
                <td>{c.active ? "Active" : "Inactive"}</td>
                <td>
                  <span
                    className="logout-btn"
                    onClick={() => handleEdit(c)}
                  >
                    <i className="fa fa-edit"></i>
                    <span className="tooltiptext">Edit course category</span>
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
