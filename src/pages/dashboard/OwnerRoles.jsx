import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";

export default function OwnerRoles() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ name: "", permissions: [] });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);

  const loadRoles = async () => {
    try {
      if ($.fn.DataTable.isDataTable("#rolesTable")) {
        $("#rolesTable").DataTable().destroy();
      }
      const res = await api.get("/roles");
      setRoles(res.data.roles || []);
    } catch (err) {
      toastr.error("Failed to load roles.", "error");
    }
  };

  const loadModules = async () => {
    try {
      const res = await api.get("/modules");
      setModules(res.data.modules || []);
    } catch (err) {
      toastr.error("Failed to load modules.", "error");
    }
  };

  useEffect(() => {
    loadRoles();
    loadModules();
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#rolesTable")) {
          $("#rolesTable").DataTable();
        }
      }, 0);
    }
  }, [roles]);

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleGlobalSelectAll = () => {
    const allPermissions = modules.flatMap((module) =>
      module.actions.map((action) =>
        action.includes(":") ? action : `${module.key}:${action}`
      )
    );
    const isAllSelected = form.permissions.length === allPermissions.length;
    setForm((prev) => ({ ...prev, permissions: isAllSelected ? [] : allPermissions }));
  };

  const handleModuleSelectAll = (module) => {
    const modulePerms = module.actions.map((action) =>
      action.includes(":") ? action : `${module.key}:${action}`
    );
    const allSelected = modulePerms.every((perm) => form.permissions.includes(perm));
    setForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !modulePerms.includes(p))
        : [...new Set([...prev.permissions, ...modulePerms])],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || form.permissions.length === 0) {
      toastr.error("Please fill all fields.", "error");
      return;
    }
    try {
      if (editId) {
        await api.put(`/roles/${editId}`, { name: form.name, permissions: form.permissions });
        toastr.success("Role updated successfully!", "success");
      } else {
        await api.post("/roles", { name: form.name, permissions: form.permissions });
        toastr.success("Role created successfully!", "success");
      }
      resetForm();
      setOpenPop(false);
      loadRoles();
    } catch (err) {
      toastr.error("Failed to save role.", "error");
    }
  };

  const handleEdit = (role) => {
    setEditId(role._id);
    setForm({ name: role.name, permissions: role.permissions || [] });
    setOpenPop(true);
  };

  const resetForm = () => {
    setForm({ name: "", permissions: [] });
    setEditId(null);
  };

  const closeModal = () => {
    setOpenPop(false);
    resetForm();
  };

  const groupPermissions = (permissions) => {
    if (permissions.includes("*")) return { all: ["All Permissions"] };
    return permissions.reduce((acc, perm) => {
      const [module, action] = perm.split(":");
      if (!acc[module]) acc[module] = [];
      acc[module].push(action);
      return acc;
    }, {});
  };

  const totalPerms = modules.reduce((acc, m) => acc + m.actions.length, 0);
  const allSelected = modules.length > 0 && form.permissions.length === totalPerms;

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Roles" subtitle="Manage roles and permissions">
        <button
          className="flex items-center gap-2 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          onClick={() => { resetForm(); setOpenPop(true); }}
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add Role
        </button>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      <TableContainer>
        <table id="rolesTable" width="100%">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => {
              const grouped = groupPermissions(r.permissions);
              return (
                <tr key={r._id}>
                  <td className="font-medium">{r.name}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(grouped).map(([module, actions]) => (
                        <div key={module} className="text-xs">
                          <span className="font-semibold capitalize text-brand-text">{module}</span>
                          <span className="text-brand-muted">: {actions.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    {!r.builtin && (
                      <button className={actionBtn} onClick={() => handleEdit(r)} title="Edit Role">
                        <i className="fa fa-edit text-xs"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>

      <Modal
        isOpen={openPop}
        onClose={closeModal}
        title={editId ? "Edit Role" : "Add Role"}
        maxWidth="max-w-2xl"
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
              {editId ? "Update Role" : "Create Role"}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
            Role Name
          </label>
          <input
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
            placeholder="e.g. Manager"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
              Permissions
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-brand-text cursor-pointer">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-emerald"
                checked={allSelected}
                onChange={handleGlobalSelectAll}
              />
              Select All
            </label>
          </div>

          <div className="max-h-72 overflow-y-auto border border-brand-border rounded-lg bg-canvas p-3 space-y-4">
            {modules.map((module) => {
              const modulePerms = module.actions.map((action) =>
                action.includes(":") ? action : `${module.key}:${action}`
              );
              const isModuleAllSelected = modulePerms.every((perm) =>
                form.permissions.includes(perm)
              );

              return (
                <div key={module.key}>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-brand-border">
                    <span className="text-xs font-semibold text-brand-text capitalize">
                      {module.name}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-brand-muted cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-3 h-3 accent-emerald"
                        checked={isModuleAllSelected}
                        onChange={() => handleModuleSelectAll(module)}
                      />
                      Select All
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
                    {module.actions.map((action) => {
                      const perm = action.includes(":") ? action : `${module.key}:${action}`;
                      const actionName = perm.split(":")[1];
                      return (
                        <label
                          key={perm}
                          className="flex items-center gap-1.5 text-xs text-brand-text cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-3 h-3 accent-emerald"
                            checked={form.permissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                          />
                          {actionName}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
