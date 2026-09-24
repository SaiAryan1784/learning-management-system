import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toastr from "toastr";
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
import { nameFieldsFor, isPlaceholderName } from "../../utils/personName";
import { inviteState } from "../../utils/staffInvite";

export default function OwnerStaff() {
  const { user, hasPermission, access } = useAuth();
  const navigate = useNavigate();

  // A location-scoped person (Franchise Owner, Manager) can only place people
  // at their own locations, and "no location" would mean "unassigned", not
  // "org-wide" — so their invites start with their own location(s) ticked.
  const scoped = access?.orgWide !== true;
  const homeLocations = scoped ? (access?.locations || []).map((l) => (typeof l === "string" ? l : l?._id)).filter(Boolean) : [];
  const blankForm = () => ({ email: "", roleId: "", locations: [...homeLocations], firstName: "", lastName: "" });

  // The page itself only needs staff:read, so roles that may view the team
  // without administering it (Manager) reach it. Each action is gated on the
  // permission the API enforces, so nothing is offered that would 403.
  const canCreateStaff = hasPermission("staff:create");
  const canUpdateStaff = hasPermission("staff:update");
  const canDeleteStaff = hasPermission("staff:delete");
  const canViewProgress = hasPermission("reports:read");

  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [editStaffId, setEditStaffId] = useState(null);
  const [openPop, setOpenPop] = useState(false);
  // Seat usage is computed server-side (see staffSeats.service) rather than
  // derived from staffList here — the rules about who counts (platform admins,
  // the owner's free seat) must not be duplicated in the UI and drift.
  const [seats, setSeats] = useState(null);
  // Names live on the person's account, which exists only once they accept.
  const [editHasAccount, setEditHasAccount] = useState(false);
  const [resendTarget, setResendTarget] = useState(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes, locRes, seatsRes] = await Promise.all([
        api.get("/staff"),
        // Only the roles this person may hand out — the server applies the
        // same rule on invite/update, so nothing offered here can be refused.
        api.get("/roles", { params: { grantable: true } }),
        api.get("/locations"),
        api.get("/staff/seats").catch(() => null),
      ]);
      setStaffList(staffRes.data.staff || []);
      setRoles(rolesRes.data.roles || []);
      setLocations(locRes.data.locations || []);
      setSeats(seatsRes?.data || null);
    } catch (err) {
      toastr.error("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


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
      if (res.data.otp) toastr.success(`Invite created! OTP: ${res.data.otp}`, "success");
      else if (res.data.emailSent === false) toastr.warning(res.data.message);
      else toastr.success("Invite sent", "success");
      setForm(blankForm());
      loadData();
      setOpenPop(false);
    } catch (err) {
      toastr.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to send invite",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (staff) => {
    setEditStaffId(staff._id);
    setEditHasAccount(Boolean(staff.user));
    setForm({
      email: staff.email,
      roleId: staff.role?._id || "",
      locations: staff.locations?.map((l) => l._id) || [],
      ...nameFieldsFor(staff.user, staff.email),
    });
    setOpenPop(true);
  };

  const cancelEdit = () => {
    setEditStaffId(null);
    setForm(blankForm());
    setOpenPop(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member? This cannot be undone.")) return;
    try {
      await api.delete(`/staff/${id}`);
      toastr.success("Staff member deleted");
      loadData();
    } catch (err) {
      toastr.error(err.response?.data?.error || err.response?.data?.message || "Delete failed");
    }
  };

  const handleUpdate = async () => {
    const first = form.firstName.trim();
    const last = form.lastName.trim();
    if (editHasAccount && (first || last) && !(first && last)) {
      toastr.error("Enter both a first and a last name", "error");
      return;
    }
    try {
      setSubmitting(true);
      await api.put(`/staff/${editStaffId}`, {
        roleId: form.roleId,
        locations: form.locations,
        ...(editHasAccount && first && last ? { firstName: first, lastName: last } : {}),
      });
      toastr.success("Staff updated successfully", "success");
      cancelEdit();
      loadData();
    } catch (err) {
      // The API says exactly why ("You cannot modify Owner account", a location
      // you don't hold, ...). Hiding that behind a generic line cost the client a
      // support round-trip.
      toastr.error(
        err.response?.data?.error || err.response?.data?.message || "Failed to update staff",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openResend = (s) => {
    setResendTarget(s);
    setResendEmail(s.email);
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const res = await api.post(`/staff/${resendTarget._id}/resend-invite`, { email: resendEmail.trim() });
      if (res.data?.otp) toastr.success(`New invite created! OTP: ${res.data.otp}`);
      else if (res.data?.emailSent === false) toastr.warning(res.data.message);
      else toastr.success(res.data?.message || "New invite sent");
      setResendTarget(null);
      loadData();
    } catch (err) {
      toastr.error(err.response?.data?.message || err.response?.data?.error || "Could not resend the invite");
    } finally {
      setResending(false);
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

  // Searching and filtering happen in React, deliberately.
  //
  // This table used to be handed to jQuery DataTables, which then owned the
  // DOM that React also renders — and switching tabs re-rendered the rows
  // underneath it, so React tried to remove nodes DataTables had already
  // replaced and the whole page hit its error boundary ("Something went
  // wrong"). Same trap documented in PathAssignStaff; don't reintroduce it.
  const term = search.trim().toLowerCase();
  const filteredStaff = staffList
    .filter((s) =>
      activeTab === "active" ? s.inviteStatus === "accepted" : s.inviteStatus === "pending"
    )
    .filter((s) => {
      if (!term) return true;
      const haystack = [
        s.user?.name,
        s.email,
        s.role?.name,
        ...(s.locations || []).map((l) => l.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });

  const pendingCount = staffList.filter((s) => s.inviteStatus === "pending").length;

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
    const invite = inviteState(s);
    if (invite?.expired) return <Badge tone="danger" dot size="sm">Invite expired</Badge>;
    return (
      <span title={invite?.expiresAt ? `Code valid until ${invite.expiresAt.toLocaleDateString()}` : undefined}>
        <Badge tone="warning" dot size="sm">Invite Pending</Badge>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        subtitle={
          seats
            ? `${seats.used} of ${seats.limit} seats used`
            : "Manage your team members"
        }
      >
        {canCreateStaff && (
          <Button
            variant="primary"
            size="sm"
            disabled={seats?.atLimit}
            title={
              seats?.atLimit
                ? `Staff limit reached (${seats.used} of ${seats.limit}). Remove or deactivate someone to free a seat.`
                : undefined
            }
            leadingIcon={<i className="fa-solid fa-plus text-xs" />}
            onClick={() => {
              setEditStaffId(null);
              setForm(blankForm());
              setOpenPop(true);
            }}
          >
            Add Staff
          </Button>
        )}
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors no-underline"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {[
          { v: "active", label: "Active" },
          { v: "pending", label: `Pending invites${pendingCount ? ` (${pendingCount})` : ""}` },
        ].map((tab) => (
          <button
            key={tab.v}
            className={`relative px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === tab.v ? "text-white" : "text-brand-muted hover:text-brand-text"
            }`}
            onClick={() => setActiveTab(tab.v)}
          >
            {activeTab === tab.v && (
              <motion.span
                layoutId="staff-tab-pill"
                className="absolute inset-0 bg-charcoal rounded-md"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-xs">
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, role or location"
          className="w-full rounded-lg border border-brand-border bg-white py-2 pl-8 pr-3 text-sm text-brand-text placeholder-brand-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald"
        />
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
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-caption text-brand-muted">
                    {search
                      ? `No one matches "${search}".`
                      : activeTab === "active"
                        ? "No active staff yet."
                        : "No pending invites."}
                  </td>
                </tr>
              )}
              {filteredStaff.map((s) => (
                <tr key={s._id}>
                  <td>
                    {s.user ? (
                      <span className="inline-flex items-center gap-2">
                        {s.user.name}
                        {isPlaceholderName(s.user, s.email) && <Badge tone="warning" size="sm">Add real name</Badge>}
                      </span>
                    ) : (
                      "Pending activation"
                    )}
                  </td>
                  <td>{s.email}</td>
                  <td>{s.role?.name}</td>
                  <td>{s.locations?.map((l) => l.name).join(", ") || "Org Wide"}</td>
                  <td>{statusBadge(s)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {s.inviteStatus === "pending" && canCreateStaff && (
                        <button className={actionBtn} onClick={() => openResend(s)} title="Resend invite">
                          <i className="fa-solid fa-paper-plane text-xs"></i>
                        </button>
                      )}
                      {canUpdateStaff && (
                        <button className={actionBtn} onClick={() => handleEdit(s)} title="Edit Staff">
                          <i className="fa fa-edit text-xs"></i>
                        </button>
                      )}
                      {s.inviteStatus === "accepted" && canViewProgress && (
                        <button
                          className={actionBtn}
                          onClick={() => navigate(`/dashboard/staff-progress/${s._id}`)}
                          title="View Progress"
                        >
                          <i className="fa fa-chart-line text-xs"></i>
                        </button>
                      )}
                      {canDeleteStaff && (
                        <button
                          className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`}
                          onClick={() => handleDelete(s._id)}
                          title="Delete Staff"
                        >
                          <i className="fa fa-trash text-xs"></i>
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

          {editStaffId && editHasAccount && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First name" hint="Printed on their certificates.">
                <Input value={form.firstName} maxLength={60} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </FormField>
              <FormField label="Last name">
                <Input value={form.lastName} maxLength={60} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </FormField>
            </div>
          )}
          {editStaffId && !editHasAccount && (
            <p className="text-caption text-brand-muted">They'll enter their own name when they accept the invite.</p>
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

          <FormField
            label="Assign Locations"
            hint={scoped ? "They will belong to the location(s) you tick." : "Leave empty for org-wide access."}
          >
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

      <Modal
        isOpen={Boolean(resendTarget)}
        onClose={() => setResendTarget(null)}
        title="Resend invite"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResendTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={resending} onClick={handleResend}>Send new invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-muted">
            A fresh code is emailed, valid for 5 days. Any earlier invite email for this person stops working.
          </p>
          <FormField label="Email" hint="Correct the address here if it was mistyped.">
            <Input type="email" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
