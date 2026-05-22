import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";
import { SectionLoader } from "../../components/ui/Spinner";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function Modules() {
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ key: "", name: "", actions: [] });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadModules = async () => {
    try {
      setLoading(true);
      if ($.fn.DataTable.isDataTable("#modulesTable")) {
        $("#modulesTable").DataTable().destroy();
      }
      const res = await api.get("/modules");
      setModules(res.data.modules || []);
    } catch {
      toastr.error("Failed to load modules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadModules(); }, []);

  useEffect(() => {
    if (modules.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#modulesTable")) {
          $("#modulesTable").DataTable();
        }
      }, 0);
    }
  }, [modules]);

  const toggleAction = (a) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.includes(a) ? prev.actions.filter((x) => x !== a) : [...prev.actions, a],
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        actions: form.actions.map((a) => (form.key === "courses" ? `course:${a}` : a)),
      };
      if (editId) {
        await api.put(`/modules/${editId}`, payload);
        toastr.success("Module updated!");
      } else {
        await api.post("/modules", payload);
        toastr.success("Module added!");
      }
      resetForm();
      setOpenPop(false);
      loadModules();
    } catch {
      toastr.error("Please fill all the fields.");
    }
  };

  const handleEdit = (m) => {
    setEditId(m._id);
    setForm({ key: m.key, name: m.name, actions: m.actions.map((a) => (a.includes(":") ? a.split(":")[1] : a)) });
    setOpenPop(true);
  };

  const resetForm = () => { setForm({ key: "", name: "", actions: [] }); setEditId(null); };
  const closeModal = () => { setOpenPop(false); resetForm(); };

  const currentModule = modules.find((m) => m.key === form.key);
  const currentActions =
    currentModule?.actions.map((a) => (a.includes(":") ? a.split(":")[1] : a)) || ["create", "read", "update", "delete"];

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Main Modules" subtitle="Manage system modules and permissions">
        <button
          className="flex items-center gap-2 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          onClick={() => { resetForm(); setOpenPop(true); }}
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add Module
        </button>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {loading ? (
        <SectionLoader />
      ) : (
      <TableContainer>
        <table id="modulesTable" width="100%">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Name</th>
              <th>Key</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m, index) => (
              <tr key={m._id}>
                <td>{index + 1}</td>
                <td className="font-medium">{m.name}</td>
                <td><code className="text-xs bg-canvas px-1.5 py-0.5 rounded">{m.key}</code></td>
                <td className="text-brand-muted">{m.actions.map((a) => (a.includes(":") ? a.split(":")[1] : a)).join(", ")}</td>
                <td>
                  <button className={actionBtn} onClick={() => handleEdit(m)} title="Edit">
                    <i className="fa fa-edit text-xs"></i>
                  </button>
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
            <button className="px-4 py-2 text-sm font-semibold text-brand-muted bg-canvas border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors" onClick={closeModal}>Cancel</button>
            <button className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors" onClick={handleSubmit}>{editId ? "Update" : "Add Module"}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Key</label>
            <input
              className={inputClass}
              placeholder="e.g. courses"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value, actions: [] })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Name</label>
            <input className={inputClass} placeholder="Module Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Select Actions</label>
            <div className="flex flex-wrap gap-2">
              {currentActions.map((a) => (
                <label
                  key={a}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-semibold ${
                    form.actions.includes(a)
                      ? "bg-emerald/10 border-emerald text-emerald"
                      : "border-brand-border text-brand-muted hover:border-emerald/40"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={form.actions.includes(a)} onChange={() => toggleAction(a)} />
                  {a}
                </label>
              ))}
            </div>
            {!currentModule && form.key && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Custom Actions (comma separated)</label>
                <input
                  className={inputClass}
                  placeholder="e.g. publish, assign"
                  value={form.actions.join(", ")}
                  onChange={(e) => setForm({ ...form, actions: e.target.value.split(",").map((a) => a.trim()) })}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
