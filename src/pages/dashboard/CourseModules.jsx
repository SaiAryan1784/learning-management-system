import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function CourseModules() {
  const { courseId } = useParams();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    order: 1,
  });

  // ---------------- LOAD MODULES ----------------
  const loadModules = async () => {
    try {
      setLoading(true);

      if ($.fn.DataTable.isDataTable("#modulesTable")) {
        $("#modulesTable").DataTable().destroy();
      }

      const res = await api.get(
        `/courses/${courseId}/modules?active=true&page=1&limit=10`
      );

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

  // ---------------- DATATABLE INIT ----------------
  useEffect(() => {
    if (modules.length > 0) {
      setTimeout(() => {
        $("#modulesTable").DataTable();
      }, 100);
    }
  }, [modules]);

  // ---------------- SUBMIT MODULE ----------------
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toastr.error("Module title required");
      return;
    }

    try {
      if (editId) {
        await api.put(
          `/courses/${courseId}/modules/${editId}`,
          form
        );
        toastr.success("Module updated!");
      } else {
        await api.post(
          `/courses/${courseId}/modules`,
          form
        );
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

  // ---------------- EDIT MODULE ----------------
  const handleEdit = (m) => {
    setEditId(m._id);
    setForm({
      title: m.title,
      description: m.description,
      order: m.order,
    });
    setOpenPop(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------- RESET FORM ----------------
  const resetForm = () => {
    setEditId(null);
    setForm({
      title: "",
      description: "",
      order: 1,
    });
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">COURSE MODULE </h1>
        <p className="wlc-ms">
          Please add your course module's and take a look at your business.
        </p>
      </div>
      <div className="tp-sc">
        <span className="logout-btn" 
        onClick={() => {
          resetForm();
          setOpenPop(true);
        }}><i className="fa-solid fa-plus"></i>
          <span className="tooltiptext">Add Course Module</span></span>
        <Link to="/dashboard/courses" className="logout-btn">
          <i className="fa-solid fa-arrow-left"></i>
            <span className="tooltiptext">Back to courses</span>

        </Link>
      </div>
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
          {editId ? "Edit Module" : "Add Module"}
        </h2>

        <input
          className="login-ip"
          placeholder="Module Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <textarea
          className="login-ip"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          type="number"
          className="login-ip"
          placeholder="Order"
          value={form.order}
          onChange={(e) =>
            setForm({ ...form, order: e.target.value })
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

      {/* TABLE OR EMPTY STATE */}
      {loading ? (
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Loading modules...
        </p>
      ) : modules.length === 0 ? (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>No modules available Please add a module for this course.</h3>
        </div>
      ) : (
        <table
          id="modulesTable"
          border="1"
          cellPadding="10"
          cellSpacing="0"
          width="100%"
        >
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m, i) => (
              <tr key={m._id}>
                <td>{m.title}</td>
                <td>{m.description}</td>
                <td>{m.order}</td>
                <td>
                  <div className="act-btns">
                    <span
                    className="logout-btn"
                    onClick={() => handleEdit(m)}
                    style={{ cursor: "pointer" }}
                    >
                    <i className="fa fa-edit"></i>
                    <span className="tooltiptext">Edit module</span>
                    </span>
                    <Link
                      to={`/dashboard/courses/${courseId}/modules/${m._id}/lessons`}
                      className="logout-btn"
                      style={{ marginLeft: "8px" }}
                    >
                      <i className="fa fa-list"></i>
                      <span className="tooltiptext">Add lesson</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
