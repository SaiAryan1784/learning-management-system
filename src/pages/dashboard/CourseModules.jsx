import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";
import { SectionLoader } from "../../components/ui/Spinner";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function CourseModules() {
  const { courseId } = useParams();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);

  const [form, setForm] = useState({ title: "", description: "", order: 1 });

  const loadModules = async () => {
    try {
      setLoading(true);
      if ($.fn.DataTable.isDataTable("#modulesTable")) {
        $("#modulesTable").DataTable().destroy();
      }
      const res = await api.get(`/courses/${courseId}/modules?active=true&page=1&limit=10`);
      setModules(res.data.modules || []);
    } catch (err) {
      console.log(err);
      toastr.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, [courseId]);

  useEffect(() => {
    if (modules.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#modulesTable")) {
          $("#modulesTable").DataTable();
        }
      }, 100);
    }
  }, [modules]);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toastr.error("Module title required"); return; }
    try {
      if (editId) {
        await api.put(`/courses/${courseId}/modules/${editId}`, form);
        toastr.success("Module updated!");
      } else {
        await api.post(`/courses/${courseId}/modules`, form);
        toastr.success("Module added!");
      }
      resetForm();
      setOpenPop(false);
      loadModules();
    } catch (err) {
      console.log(err);
      toastr.error("Error saving module");
    }
  };

  const handleEdit = (m) => {
    setEditId(m._id);
    setForm({ title: m.title, description: m.description, order: m.order });
    setOpenPop(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ title: "", description: "", order: 1 });
  };

  const closeModal = () => {
    setOpenPop(false);
    resetForm();
  };

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Course Modules" subtitle="Manage modules for this course">
        <button
          className="flex items-center gap-2 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          onClick={() => { resetForm(); setOpenPop(true); }}
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add Module
        </button>
        <Link
          to="/dashboard/courses"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {loading ? (
        <SectionLoader />
      ) : modules.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-cubes text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No modules yet. Add one to get started.</p>
        </div>
      ) : (
        <TableContainer>
          <table id="modulesTable" width="100%">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m._id}>
                  <td>{m.title}</td>
                  <td>{m.description}</td>
                  <td>{m.order}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className={actionBtn} onClick={() => handleEdit(m)} title="Edit module">
                        <i className="fa fa-edit text-xs"></i>
                      </button>
                      <Link
                        to={`/dashboard/courses/${courseId}/modules/${m._id}/lessons`}
                        className={actionBtn}
                        title="Add lessons"
                      >
                        <i className="fa fa-list text-xs"></i>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}

      <Modal
        isOpen={openPop}
        onClose={closeModal}
        title={editId ? "Edit Module" : "Add Module"}
        footer={
          <>
            <button
              className="px-4 py-2 text-sm font-semibold text-brand-muted bg-canvas border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors"
              onClick={handleSubmit}
            >
              {editId ? "Update" : "Add Module"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Module Title</label>
            <input className={inputClass} placeholder="e.g. Introduction" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
            <textarea className={inputClass} placeholder="Module description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Order</label>
            <input type="number" className={inputClass} placeholder="1" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
