import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import {
  PageHeader,
  TableContainer,
  Modal,
  SectionLoader,
  Button,
  Input,
  Textarea,
  FormField,
  Badge,
} from "../../components/ui";

export default function CourseCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      if ($.fn.DataTable.isDataTable("#catTable")) {
        $("#catTable").DataTable().destroy();
      }
      const res = await api.get("/course-categories?active=true&page=1&limit=20");
      setCategories(res.data.categories || []);
    } catch {
      toastr.error("Failed to load categories");
    } finally {
      setLoading(false);
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
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description });
    setEditId(cat._id);
    setOpenPop(true);
  };

  const resetForm = () => { setForm({ name: "", description: "" }); setEditId(null); };
  const closeModal = () => { setOpenPop(false); resetForm(); };

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald-muted hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Course Categories" subtitle="Manage course categories">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={() => { resetForm(); setOpenPop(true); }}
        >
          Add Category
        </Button>
        <Link to="/dashboard/courses">
          <Button variant="outline" size="sm">Add Course</Button>
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors no-underline"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {loading ? (
        <SectionLoader />
      ) : (
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
                    <Badge tone={c.active ? "success" : "neutral"} dot size="sm">
                      {c.active ? "Active" : "Inactive"}
                    </Badge>
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
      )}

      <Modal
        isOpen={openPop}
        onClose={closeModal}
        title={editId ? "Edit Category" : "Add Category"}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {editId ? "Update" : "Add Category"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Category Name" required>
            <Input
              placeholder="Category Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              placeholder="Description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
