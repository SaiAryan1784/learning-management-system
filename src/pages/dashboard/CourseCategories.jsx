import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function CourseCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);

  const loadCategories = async () => {
    try {
      if ($.fn.DataTable.isDataTable("#catTable")) {
        $("#catTable").DataTable().destroy();
      }
      const res = await api.get("/course-categories?active=true&page=1&limit=20");
      setCategories(res.data.categories || []);
    } catch {
      toastr.error("Failed to load categories");
    }
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#catTable")) {
          $("#catTable").DataTable();
        }
      }, 0);
    }
  }, [categories]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toastr.error("Category name is required"); return; }
    try {
      if (editId) {
        await api.put(`/course-categories/${editId}`, { name: form.name, description: form.description, active: true });
        toastr.success("Category updated");
      } else {
        await api.post("/course-categories", form);
        toastr.success("Category created");
      }
      resetForm();
      setOpenPop(false);
      loadCategories();
    } catch {
      toastr.error("Something went wrong");
    }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description });
    setEditId(cat._id);
    setOpenPop(true);
  };

  const resetForm = () => { setForm({ name: "", description: "" }); setEditId(null); };
  const closeModal = () => { setOpenPop(false); resetForm(); };

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Course Categories" subtitle="Manage course categories">
        <button
          className="flex items-center gap-2 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          onClick={() => { resetForm(); setOpenPop(true); }}
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add Category
        </button>
        <Link
          to="/dashboard/courses"
          className="flex items-center gap-2 px-3 py-1.5 border border-emerald/40 text-emerald rounded-lg text-xs font-semibold hover:bg-emerald hover:text-white transition-colors"
        >
          Add Course
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      <TableContainer>
        <table id="catTable" width="100%">
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
              <tr><td colSpan="4" className="text-center text-brand-muted py-8">No categories found</td></tr>
            ) : (
              categories.map((c, i) => (
                <tr key={`${c._id}-${i}`}>
                  <td>{c.name}</td>
                  <td>{c.description}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.active ? "bg-emerald/10 text-emerald" : "bg-brand-muted/10 text-brand-muted"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className={actionBtn} onClick={() => handleEdit(c)} title="Edit">
                      <i className="fa fa-edit text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableContainer>

      <Modal
        isOpen={openPop}
        onClose={closeModal}
        title={editId ? "Edit Category" : "Add Category"}
        footer={
          <>
            <button className="px-4 py-2 text-sm font-semibold text-brand-muted bg-canvas border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors" onClick={closeModal}>Cancel</button>
            <button className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors" onClick={handleSubmit}>{editId ? "Update" : "Add Category"}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Category Name</label>
            <input className={inputClass} placeholder="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
            <textarea className={inputClass} placeholder="Description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
