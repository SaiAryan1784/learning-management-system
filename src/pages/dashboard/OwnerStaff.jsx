import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";

export default function OwnerStaff() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    email: "",
    roleId: "",
    locations: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [editStaffId, setEditStaffId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ Destroy old DataTable before reload
      if ($.fn.DataTable.isDataTable("#staffTable")) {
        $("#staffTable").DataTable().destroy();
      }

      const [staffRes, rolesRes, locRes] = await Promise.all([
        api.get("/staff"),
        api.get("/roles"),
        api.get("/locations"),
      ]);

      setStaffList(staffRes.data.staff || []);
      setRoles(rolesRes.data.roles || []);
      setLocations(locRes.data.locations || []);
    } catch (err) {
      toastr.error("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Apply DataTable after table render
  useEffect(() => {
    if (!loading && staffList.length > 0) {
      setTimeout(() => {
        $("#staffTable").DataTable();
      }, 0);
    }
  }, [staffList, loading, activeTab]);

  const handleInvite = async () => {
    if (!form.email || !form.roleId) {
      toastr.error("Email and Role are required", "error");
      return;
    }
    try {
      const payload = {
        email: form.email,
        roleId: form.roleId,
        locations: form.locations,
      };
      const res = await api.post("staff/invite", payload);
      toastr.success(`Invite created! OTP: ${res.data.otp}`, "success");
      setForm({ email: "", roleId: "", locations: [] });
      loadData();
    } catch (err) {
      toastr.error("Failed to send invite", "error");
    }
  };

  const handleEdit = (staff) => {
    setEditStaffId(staff._id);
    setForm({
      email: staff.email,
      roleId: staff.role?._id || "",
      locations: staff.locations?.map((l) => l._id) || [],
    });
  };

  const cancelEdit = () => {
    setEditStaffId(null);
    setForm({ email: "", roleId: "", locations: [] });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/staff/${editStaffId}`, {
        roleId: form.roleId,
        locations: form.locations,
      });
      toastr.success("Staff updated successfully", "success");
      cancelEdit();
      loadData();
    } catch (err) {
      toastr.error("Failed to update staff", "error");
    }
  };

  const toggleLocation = (locId) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(locId)
        ? prev.locations.filter((id) => id !== locId)
        : [...prev.locations, locId],
    }));
  };

  const toggleActive = async (staff) => {
    try {
      await api.put(`/staff/${staff._id}/status`, { active: !staff.active });
      toastr.success(
        `Staff ${staff.active ? "deactivated" : "activated"} successfully`,
        "success"
      );
      loadData();
    } catch (err) {
      toastr.error("Failed to update status", "error");
    }
  };

  const filteredStaff = staffList.filter((s) =>
    activeTab === "active"
      ? s.inviteStatus === "accepted"
      : s.inviteStatus === "pending"
  );

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">STAFF'S</h1>
        <p className="wlc-ms">
          Please add the staff's and take a look at your business.
        </p>
      </div>

      <div className="frm-cntr">
        <Link className="logout-btn" to="/dashboard">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h2 className="sc-tl">
          {editStaffId ? "Edit Staff" : "Invite Staff"}
        </h2>

        {!editStaffId && (
          <input
            className="login-ip"
            placeholder="Staff Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        )}

        <select
          className="login-ip"
          value={form.roleId}
          onChange={(e) => setForm({ ...form, roleId: e.target.value })}
        >
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>

        <div>
          <h3 className="frm-tl">Assign Locations:</h3>
          <div className="chk-wp">
            {locations.map((loc) => (
              <label key={loc._id}>
                <input
                  type="checkbox"
                  checked={form.locations.includes(loc._id)}
                  onChange={() => toggleLocation(loc._id)}
                />
                {loc.name}
              </label>
            ))}
          </div>
        </div>

        <button
          className="snd-btn"
          onClick={editStaffId ? handleUpdate : handleInvite}
        >
          {editStaffId ? "Update Staff" : "Invite Staff"}
        </button>

        {editStaffId && (
          <button
            className="snd-btn"
            style={{ marginLeft: "10px" }}
            onClick={cancelEdit}
          >
            Cancel
          </button>
        )}
      </div>

      <div className="pg-tabs">
        <span
          className={`pg-tb ${activeTab === "active" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active
        </span>
        <span
          className={`pg-tb ${activeTab === "inactive" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("inactive")}
        >
          Inactive
        </span>
      </div>

      {loading ? (
        <p>Loading staff...</p>
      ) : (
        <table
          id="staffTable"
          border="1"
          cellPadding="10"
          cellSpacing="0"
          width="100%"
        >
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Locations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((s, index) => (
              <tr key={s._id}>
                <td>{index + 1}</td>
                <td>
                  {s.user?.name ||
                    "Name will appear after the staff is Active"}
                </td>
                <td>{s.email}</td>
                <td>{s.role?.name}</td>
                <td>
                  {s.locations?.map((l) => l.name).join(", ") || "Org Wide"}
                </td>
                <td>
                  {s.inviteStatus === "accepted"
                    ? s.active
                      ? "Active"
                      : "Disabled"
                    : "Invite Pending"}
                </td>
                <td>
                  <div className="act-btns">
                    <span
                    className="logout-btn"
                    onClick={() => handleEdit(s)}
                    >
                      <i className="fa fa-edit"></i>
                      <span className="tooltiptext">Edit staff</span>
                    </span>
                    {/* {s.inviteStatus === "accepted" && (
                      <span
                        className="snd-btn"
                        style={{ marginLeft: "5px" }}
                        onClick={() => toggleActive(s)}
                      >
                        {s.active ? "Deactivate" : "Activate"}
                      </span>
                    )} */}
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
