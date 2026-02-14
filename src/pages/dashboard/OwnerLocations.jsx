import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";

export default function OwnerLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [editId, setEditId] = useState(null);

  // ✅ Load Locations
  const loadLocations = async () => {
    try {
      // Destroy old DataTable before reload
      if ($.fn.DataTable.isDataTable("#locationsTable")) {
        $("#locationsTable").DataTable().destroy();
      }

      const res = await api.get("/locations");
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Error loading locations:", err);
      toastr.error("Failed to load locations.", "error");
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  // ✅ Apply DataTable after table renders
  useEffect(() => {
    if (locations.length > 0) {
      setTimeout(() => {
        $("#locationsTable").DataTable();
      }, 0);
    }
  }, [locations]);

  // ✅ Submit
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toastr.error("Location name is required", "error");
      return;
    }

    if (!form.address.trim()) {
      toastr.error("Address is required", "error");
      return;
    }

    if (!form.phone.trim()) {
      toastr.error("Phone is required", "error");
      return;
    }

    try {
      if (editId) {
        await api.put(`/locations/${editId}`, form);
        toastr.success("Location updated successfully!", "success");
      } else {
        await api.post("/locations", form);
        toastr.success("Location added successfully!", "success");
      }

      resetForm();
      loadLocations();
    } catch (err) {
      toastr.error("Something went wrong. Try again.", "error");
    }
  };

  const handleEdit = (loc) => {
    setEditId(loc._id);
    setForm({ name: loc.name, address: loc.address, phone: loc.phone });
  };

  const cancelEdit = () => resetForm();

  const resetForm = () => {
    setForm({ name: "", address: "", phone: "" });
    setEditId(null);
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">LOCATION'S</h1>
        <p className="wlc-ms">
          Please add your location's and take a look at your business.
        </p>
      </div>

      {/* Form */}
      <div className="frm-cntr">
        <Link className="logout-btn" to="/dashboard">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h2 className="sc-tl">{editId ? "Edit Location" : "Add Location"}</h2>

        <input
          className="login-ip"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="login-ip"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          className="login-ip"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

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

      {/* Locations Table */}
      <table
        id="locationsTable"
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
        className="stripe"
      >
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No locations found
              </td>
            </tr>
          ) : (
            locations.map((loc, index) => (
              <tr key={loc._id}>
                <td>{index + 1}</td>
                <td>{loc.name}</td>
                <td>{loc.address}</td>
                <td>{loc.phone}</td>
                <td>
                  <span
                    className="logout-btn"
                    onClick={() => handleEdit(loc)}
                  >
                    <i className="fa-solid fa-edit"></i>
                    <span className="tooltiptext">Edit location</span>
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
