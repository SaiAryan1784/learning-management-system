import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toastr from "toastr";
import $ from "jquery";
import {
  PageHeader,
  TableContainer,
  Modal,
  SectionLoader,
  Button,
  Input,
  Select,
  FormField,
  Badge,
} from "../../components/ui";

export default function OwnerStaff() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ email: "", roleId: "", locations: [] });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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
      setSubmitting(true);
      await api.put(`/staff/${editStaffId}`, {
        roleId: form.roleId,
        locations: form.locations,
      });
      toastr.success("Staff updated successfully", "success");
      cancelEdit();
      loadData();
    } catch (err) {
      toastr.error("Failed to update staff", "error");
    } finally {
      setSubmitting(false);
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

  const actionBtn =
    "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald-muted hover:text-emerald hover:border-emerald transition-colors";

  const statusBadge = (s) => {
    if (s.inviteStatus === "accepted") {
      return s.active ? (
        <Badge tone="success" dot size="sm">Active</Badge>
      ) : (
        <Badge tone="danger" dot size="sm">Disabled</Badge>
      );
    }
    return <Badge tone="warning" dot size="sm">Invite Pending</Badge>;
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Staff" subtitle="Manage your team members">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={() => {
            setEditStaffId(null);
            setForm({ email: "", roleId: "", locations: [] });
            setOpenPop(true);
          }}
        >
          Add Staff
        </Button>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors no-underline"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {["active", "inactive"].map((tab) => (
          <button
            key={tab}
            className={`relative px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
              activeTab === tab ? "text-white" : "text-brand-muted hover:text-brand-text"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {activeTab === tab && (
              <motion.span
                layoutId="staff-tab-pill"
                className="absolute inset-0 bg-charcoal rounded-md"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoader />
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
                  <td>{statusBadge(s)}</td>
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

      <Modal
        isOpen={openPop}
        onClose={cancelEdit}
        title={editStaffId ? "Edit Staff" : "Invite Staff"}
        footer={
          <>
            <Button variant="ghost" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={editStaffId ? handleUpdate : handleInvite}
            >
              {editStaffId ? "Update Staff" : "Invite Staff"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editStaffId && (
            <FormField label="Staff Email" required>
              <Input
                type="email"
                placeholder="staff@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
          )}

          <FormField label="Role" required>
            <Select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Assign Locations" hint="Leave empty for org-wide access.">
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <motion.label
                  key={loc._id}
                  whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-caption font-semibold ${
                    form.locations.includes(loc._id)
                      ? "bg-emerald-muted border-emerald text-emerald-hover"
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
                </motion.label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
