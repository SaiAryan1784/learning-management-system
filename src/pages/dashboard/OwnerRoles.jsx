import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";

export default function OwnerRoles() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({
    name: "",
    moduleKey: "",
    permissions: [],
  });
  const [editId, setEditId] = useState(null);

  const loadRoles = async () => {
    try {
      // ✅ Destroy old DataTable before reload
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

  // ✅ Apply DataTable after render
  useEffect(() => {
    if (roles.length > 0) {
      setTimeout(() => {
        $("#rolesTable").DataTable();
      }, 0);
    }
  }, [roles]);

  const handleModuleChange = (moduleKey) => {
    setForm((prev) => ({ ...prev, moduleKey, permissions: [] }));
  };

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.name || !form.moduleKey || form.permissions.length === 0) {
        toastr.error("Please fill all fields.", "error");
        return;
      }

      const payload = {
        name: form.name,
        permissions: form.permissions.map(
          (p) => `${form.moduleKey}:${p}`
        ),
      };

      if (editId) {
        await api.put(`/roles/${editId}`, payload);
        toastr.success("Role updated successfully!", "success");
      } else {
        await api.post("/roles", payload);
        toastr.success("Role created successfully!", "success");
      }

      resetForm();
      loadRoles();
    } catch (err) {
      toastr.error("Failed to save role.", "error");
    }
  };

  const handleEdit = (role) => {
    setEditId(role._id);
    const moduleKey = role.permissions[0]?.split(":")[0] || "";
    const perms = role.permissions.map((p) => p.split(":")[1]);
    setForm({ name: role.name, moduleKey, permissions: perms });
  };

  const cancelEdit = () => resetForm();

  const resetForm = () => {
    setForm({ name: "", moduleKey: "", permissions: [] });
    setEditId(null);
  };

  const currentModule = modules.find((m) => m.key === form.moduleKey);
  const currentActions =
    currentModule?.actions.map((a) =>
      a.includes(":") ? a.split(":")[1] : a
    ) || [];

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">ROLE'S</h1>
        <p className="wlc-ms">
          Please add the role's and take a look at your business.
        </p>
      </div>

      <div className="frm-cntr">
        <Link className="logout-btn" to="/dashboard">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h2 className="sc-tl">{editId ? "Edit Role" : "Add Role"}</h2>

        <input
          className="login-ip"
          placeholder="Role Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <select
          className="login-ip"
          value={form.moduleKey}
          onChange={(e) => handleModuleChange(e.target.value)}
        >
          <option value="">Select Module</option>
          {modules.map((m) => (
            <option key={m._id} value={m.key}>
              {m.name}
            </option>
          ))}
        </select>

        {currentActions.length > 0 && (
          <div>
            <h3 className="frm-tl">Select Permissions:</h3>
            <div className="chk-wp">
              {currentActions.map((a) => (
                <label key={a}>
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(a)}
                    onChange={() => togglePermission(a)}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
        )}

        <button className="snd-btn" onClick={handleSubmit}>
          {editId ? "Update" : "Add"}
        </button>

        {editId && (
          <button
            className="snd-btn"
            style={{ marginLeft: "10px" }}
            onClick={cancelEdit}
          >
            Cancel
          </button>
        )}
      </div>

      <table
        id="rolesTable"
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Role Name</th>
            <th>Permissions for assigned modules</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No roles found
              </td>
            </tr>
          ) : (
            roles.map((r, index) => (
              <tr key={r._id}>
                <td>{index + 1}</td>
                <td>{r.name}</td>
                <td>{r.permissions.join(", ")}</td>
                <td>
                  {!r.builtin && (
                    <span
                      className="logout-btn"
                      onClick={() => handleEdit(r)}
                    >
                      <i className="fa fa-edit"></i>
                      <span className="tooltiptext">Edit Role</span>
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
