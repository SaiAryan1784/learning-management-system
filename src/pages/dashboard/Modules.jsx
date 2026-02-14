import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";

export default function Modules() {
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ key: "", name: "", actions: [] });
  const [editId, setEditId] = useState(null);

  // 🔥 Load Modules
  const loadModules = async () => {
    try {
      // Destroy old datatable before reloading
      if ($.fn.DataTable.isDataTable("#modulesTable")) {
        $("#modulesTable").DataTable().destroy();
      }

      const res = await api.get("/modules");
      setModules(res.data.modules || []);
    } catch (error) {
      console.error(error);
      toastr.error("Failed to load modules.");
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  // 🔥 Apply DataTable AFTER table renders
  useEffect(() => {
    if (modules.length > 0) {
      setTimeout(() => {
        $("#modulesTable").DataTable();
      }, 0);
    }
  }, [modules]);

  const toggleAction = (a) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.includes(a)
        ? prev.actions.filter((x) => x !== a)
        : [...prev.actions, a],
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        actions: form.actions.map((a) =>
          form.key === "courses" ? `course:${a}` : a
        ),
      };

      if (editId) {
        await api.put(`/modules/${editId}`, payload);
        toastr.success("Module updated successfully!");
      } else {
        await api.post("/modules", payload);
        toastr.success("Module added successfully!");
      }

      resetForm();
      loadModules();
    } catch (error) {
      console.error(error);
      toastr.error("Please fill all the fields.");
    }
  };

  const handleEdit = (m) => {
    setEditId(m._id);
    setForm({
      key: m.key,
      name: m.name,
      actions: m.actions.map((a) =>
        a.includes(":") ? a.split(":")[1] : a
      ),
    });
  };

  const cancelEdit = () => resetForm();

  const resetForm = () => {
    setForm({ key: "", name: "", actions: [] });
    setEditId(null);
  };

  const currentModule = modules.find((m) => m.key === form.key);
  const currentActions =
    currentModule?.actions.map((a) =>
      a.includes(":") ? a.split(":")[1] : a
    ) || ["create", "read", "update", "delete"];

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">MAIN MODULE'S</h1>
        <p className="wlc-ms">
          Please add main module's and take a look at your business.
        </p>
      </div>
      <div className="frm-cntr">
        <Link className="logout-btn" to="/dashboard"><i className="fa-solid fa-arrow-left"></i></Link>
        <h2 className="sc-tl">{editId ? "Edit Module" : "Add Module"}</h2>

        <input
          className="login-ip"
          placeholder="Key"
          value={form.key}
          onChange={(e) =>
            setForm({ ...form, key: e.target.value, actions: [] })
          }
        />

        <input
          className="login-ip"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <div>
          <h3 className="frm-tl">Select Actions:</h3>
          <div className="chk-wp">
            {currentActions.map((a) => (
              <label key={a}>
                <input
                  type="checkbox"
                  checked={form.actions.includes(a)}
                  onChange={() => toggleAction(a)}
                />
                {a}
              </label>
            ))}
          </div>
        </div>

        {!currentModule && form.key && (
          <div style={{ marginTop: "10px" }}>
            <strong>Custom Actions (comma separated):</strong>
            <input
              className="login-ip"
              placeholder="e.g., publish, assign"
              value={form.actions.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  actions: e.target.value.split(",").map((a) => a.trim()),
                })
              }
            />
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

      {/* ✅ Proper Table for DataTable */}
      <table
        id="modulesTable"
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
        className=""
      >
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
              <td>{m.name}</td>
              <td>{m.key}</td>
              <td>
                {m.actions
                  .map((a) =>
                    a.includes(":") ? a.split(":")[1] : a
                  )
                  .join(", ")}
              </td>
              <td>
                <span
                  className="logout-btn"
                  onClick={() => handleEdit(m)}
                >
                  <i className="fa-solid fa-edit"></i>
                  <span className="tooltiptext">Edit module</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
