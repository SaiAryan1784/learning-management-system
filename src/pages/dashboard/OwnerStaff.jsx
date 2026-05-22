import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function OwnerStaff() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ email: "", roleId: "", locations: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [editStaffId, setEditStaffId] = useState(null);
  const [openPop, setOpenPop] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    if (!loading && staffList.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#staffTable")) {
          $("#staffTable").DataTable();
        }
      }, 0);
    }
  }, [staffList, loading, activeTab]);

  const handleInvite = async () => {
    if (!form.email || !form.roleId) {
      toastr.error("Email and Role are required", "error");
      return;
    }
    try {
      const res = await api.post("staff/invite", {
        email: form.email,
        roleId: form.roleId,
        locations: form.locations,
      });
      toastr.success(`Invite created! OTP: ${res.data.otp}`, "success");
      setForm({ email: "", roleId: "", locations: [] });
      loadData();
      setOpenPop(false);
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
    setOpenPop(true);
  };

  const cancelEdit = () => {
    setEditStaffId(null);
    setForm({ email: "", roleId: "", locations: [] });
    setOpenPop(false);
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

  const filteredStaff = staffList.filter((s) =>
    activeTab === "active" ? s.inviteStatus === "accepted" : s.inviteStatus === "pending"
  );

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Staff" subtitle="Manage your team members">
        <button
          className="flex items-center gap-2 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          onClick={() => { setEditStaffId(null); setForm({ email: "", roleId: "", locations: [] }); setOpenPop(true); }}
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add Staff
        </button>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {/* Tab Pills */}
      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {["active", "inactive"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
              activeTab === tab
                ? "bg-charcoal text-white"
                : "text-brand-muted hover:text-brand-text"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-brand-muted text-sm">Loading staff...</p>
      ) : (
        <TableContainer>
          <table id="staffTable" width="100%">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Locations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s._id}>
                  <td>{s.user?.name || "Pending activation"}</td>
                  <td>{s.email}</td>
                  <td>{s.role?.name}</td>
                  <td>{s.locations?.map((l) => l.name).join(", ") || "Org Wide"}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        s.inviteStatus === "accepted"
                          ? s.active
                            ? "bg-emerald/10 text-emerald"
                            : "bg-brand-danger/10 text-brand-danger"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {s.inviteStatus === "accepted" ? (s.active ? "Active" : "Disabled") : "Invite Pending"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className={actionBtn} onClick={() => handleEdit(s)} title="Edit Staff">
                        <i className="fa fa-edit text-xs"></i>
                      </button>
                      {s.inviteStatus === "accepted" && (
                        <button
                          className={actionBtn}
                          onClick={() => navigate(`/dashboard/staff-progress/${s._id}`)}
                          title="View Progress"
                        >
                          <i className="fa fa-chart-line text-xs"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}

      {/* Modal */}
      <Modal
        isOpen={openPop}
        onClose={cancelEdit}
        title={editStaffId ? "Edit Staff" : "Invite Staff"}
        footer={
          <>
            <button
              className="px-4 py-2 text-sm font-semibold text-brand-muted bg-canvas border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors"
              onClick={cancelEdit}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors"
              onClick={editStaffId ? handleUpdate : handleInvite}
            >
              {editStaffId ? "Update Staff" : "Invite Staff"}
            </button>
          </>
        }
      >
        {!editStaffId && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
              Staff Email
            </label>
            <input
              className={inputClass}
              placeholder="staff@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
            Role
          </label>
          <select
            className={inputClass}
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
            Assign Locations
          </label>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <label
                key={loc._id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-semibold ${
                  form.locations.includes(loc._id)
                    ? "bg-emerald/10 border-emerald text-emerald"
                    : "border-brand-border text-brand-muted hover:border-emerald/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.locations.includes(loc._id)}
                  onChange={() => toggleLocation(loc._id)}
                />
                {loc.name}
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
