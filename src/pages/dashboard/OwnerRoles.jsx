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
    permissions: [],
  });
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
        $("#rolesTable").DataTable();
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

  // ✅ GLOBAL SELECT ALL
  const handleGlobalSelectAll = () => {
    const allPermissions = [];

    modules.forEach((module) => {
      module.actions.forEach((action) => {
        const perm = action.includes(":")
          ? action
          : `${module.key}:${action}`;
        allPermissions.push(perm);
      });
    });

    const isAllSelected =
      form.permissions.length === allPermissions.length;

    setForm((prev) => ({
      ...prev,
      permissions: isAllSelected ? [] : allPermissions,
    }));
  };

  // ✅ MODULE SELECT ALL
  const handleModuleSelectAll = (module) => {
    const modulePerms = module.actions.map((action) =>
      action.includes(":")
        ? action
        : `${module.key}:${action}`
    );

    const allSelected = modulePerms.every((perm) =>
      form.permissions.includes(perm)
    );

    setForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(
            (p) => !modulePerms.includes(p)
          )
        : [...new Set([...prev.permissions, ...modulePerms])],
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.name || form.permissions.length === 0) {
        toastr.error("Please fill all fields.", "error");
        return;
      }

      const payload = {
        name: form.name,
        permissions: form.permissions,
      };

      if (editId) {
        await api.put(`/roles/${editId}`, payload);
        toastr.success("Role updated successfully!", "success");
      } else {
        await api.post("/roles", payload);
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
    setForm({
      name: role.name,
      permissions: role.permissions || [],
    });
    setOpenPop(true);
  };

  const resetForm = () => {
    setForm({ name: "", permissions: [] });
    setEditId(null);
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

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">ROLE'S</h1>
      </div>

      <div className="tp-sc">
        <span
          className="snd-btn"
          onClick={() => {
            resetForm();
            setOpenPop(true);
          }}
        >
          Add Role
        </span>

        <Link to="/dashboard" className="logout-btn">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
      </div>

      {/* POPUP */}
      <div className={`frm-cntr ${openPop ? "open" : ""}`}>
        <span
          className="logout-btn"
          onClick={() => {
            setOpenPop(false);
            resetForm();
          }}
        >
          <i className="fa-solid fa-close"></i>
        </span>

        <h2 className="sc-tl">
          {editId ? "Edit Role" : "Add Role"}
        </h2>

        <input
          className="login-ip"
          placeholder="Role Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        {/* ✅ PERMISSIONS SECTION */}
        <div>
          <h3 className="frm-tl">Select Permissions:</h3>

          {/* GLOBAL SELECT */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontWeight: "bold", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={
                  modules.length > 0 &&
                  form.permissions.length ===
                    modules.reduce(
                      (acc, m) => acc + m.actions.length,
                      0
                    )
                }
                onChange={handleGlobalSelectAll}
                style={{ marginRight: "6px" }}
              />
              Select All Permissions
            </label>
          </div>

          <div
            style={{
              maxHeight: "350px",
              overflowY: "auto",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#fafafa",
            }}
          >
            {modules.map((module) => {
              const modulePerms = module.actions.map(
                (action) =>
                  action.includes(":")
                    ? action
                    : `${module.key}:${action}`
              );

              const isModuleAllSelected =
                modulePerms.every((perm) =>
                  form.permissions.includes(perm)
                );

              return (
                <div
                  key={module.key}
                  style={{ marginBottom: "20px" }}
                >
                  {/* MODULE HEADER */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "5px",
                    }}
                  >
                    <strong
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {module.name}
                    </strong>

                    <label
                      style={{
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isModuleAllSelected}
                        onChange={() =>
                          handleModuleSelectAll(module)
                        }
                        style={{ marginRight: "5px" }}
                      />
                      Select All
                    </label>
                  </div>

                  {/* ACTION CHECKBOXES */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(160px,1fr))",
                      gap: "8px 15px",
                    }}
                  >
                    {module.actions.map((action) => {
                      const perm = action.includes(":")
                        ? action
                        : `${module.key}:${action}`;

                      const actionName =
                        perm.split(":")[1];

                      return (
                        <label
                          key={perm}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(
                              perm
                            )}
                            onChange={() =>
                              togglePermission(perm)
                            }
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

        <button className="snd-btn" onClick={handleSubmit}>
          {editId ? "Update" : "Add"}
        </button>
      </div>

      {/* TABLE (UNCHANGED) */}
      <table
        id="rolesTable"
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Permissions for assigned modules</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {roles.map((r) => {
            const grouped = groupPermissions(r.permissions);
            return (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {Object.entries(grouped).map(
                      ([module, actions]) => (
                        <div
                          key={module}
                          style={{
                            marginBottom: "10px",
                            width: "30%",
                          }}
                        >
                          <strong
                            style={{
                              textTransform: "capitalize",
                              fontWeight: "bolder",
                              textDecoration: "underline",
                            }}
                          >
                            {module}
                          </strong>
                          : {actions.join(", ")}
                        </div>
                      )
                    )}
                  </div>
                </td>
                <td>
                  {!r.builtin && (
                    <span
                      className="logout-btn"
                      onClick={() => handleEdit(r)}
                    >
                      <i className="fa fa-edit"></i>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
