import { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import {
  PageHeader,
  TableContainer,
  Modal,
  Button,
  Input,
  FormField,
} from "../../components/ui";
import { SectionLoader } from "../../components/ui/Spinner";

export default function OwnerLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manager-invite modal (explicit action, separate from create)
  const [inviteLoc, setInviteLoc] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const loadLocations = async () => {
    try {
      setLoading(true);
      if ($.fn.DataTable.isDataTable("#locationsTable")) {
        $("#locationsTable").DataTable().destroy();
      }
      const res = await api.get("/locations");
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Error loading locations:", err);
      toastr.error("Failed to load locations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#locationsTable")) {
          $("#locationsTable").DataTable();
        }
      }, 0);
    }
  }, [locations]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toastr.error("Location name is required", "error"); return; }
    if (!form.address.trim()) { toastr.error("Address is required", "error"); return; }
    if (!form.phone.trim()) { toastr.error("Phone is required", "error"); return; }
    if (!form.email.trim()) { toastr.error("Email is required", "error"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toastr.error("Enter a valid email", "error"); return; }

    try {
      setSubmitting(true);
      if (editId) {
        await api.put(`/locations/${editId}`, form);
        toastr.success("Location updated successfully!", "success");
      } else {
        await api.post("/locations", form);
        toastr.success("Location added successfully!", "success");
      }
      resetForm();
      setOpenPop(false);
      loadLocations();
    } catch (err) {
      toastr.error("Something went wrong. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (loc) => {
    setEditId(loc._id);
    setForm({ name: loc.name, address: loc.address, phone: loc.phone, email: loc.email || "" });
    setOpenPop(true);
  };

  const resetForm = () => {
    setForm({ name: "", address: "", phone: "", email: "" });
    setEditId(null);
  };

  const closeModal = () => {
    setOpenPop(false);
    resetForm();
  };

  const openInvite = (loc) => {
    setInviteLoc(loc);
    setInviteEmail(loc.email || "");
  };

  const handleInviteManager = async () => {
    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      toastr.error("Enter a valid email", "error");
      return;
    }
    try {
      setInviting(true);
      await api.post(`/locations/${inviteLoc._id}/invite-manager`, { email: inviteEmail.trim() });
      toastr.success("Manager invite sent!", "success");
      setInviteLoc(null);
      setInviteEmail("");
    } catch (err) {
      toastr.error(
        err.response?.data?.error || err.response?.data?.message || "Could not send invite",
        "error",
      );
    } finally {
      setInviting(false);
    }
  };

  const actionBtn =
    "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald-muted hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Locations" subtitle="Manage your business locations">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={() => { resetForm(); setOpenPop(true); }}
        >
          Add Location
        </Button>
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors no-underline"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {loading && <SectionLoader />}
      <div className={loading ? "hidden" : ""}>
      <TableContainer>
        <table id="locationsTable" width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-brand-muted py-8">
                  No locations found
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc._id}>
                  <td>{loc.name}</td>
                  <td>{loc.address}</td>
                  <td>{loc.phone}</td>
                  <td>{loc.email}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className={actionBtn} onClick={() => handleEdit(loc)} title="Edit">
                        <i className="fa-solid fa-edit text-xs"></i>
                      </button>
                      <button className={actionBtn} onClick={() => openInvite(loc)} title="Invite manager">
                        <i className="fa-solid fa-user-plus text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableContainer>
      </div>

      <Modal
        isOpen={openPop}
        onClose={closeModal}
        title={editId ? "Edit Location" : "Add Location"}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {editId ? "Update" : "Add Location"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            { label: "Location Name", field: "name", placeholder: "e.g. Head Office" },
            { label: "Address", field: "address", placeholder: "123 Main Street" },
            { label: "Phone", field: "phone", placeholder: "+1 555 000 0000" },
            { label: "Email", field: "email", placeholder: "location@example.com", type: "email", hint: "Contact email for this location. Use “Invite manager” later to send a manager account invite." },
          ].map(({ label, field, placeholder, type, hint }) => (
            <FormField key={field} label={label} required hint={hint}>
              <Input
                type={type || "text"}
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </FormField>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={!!inviteLoc}
        onClose={() => setInviteLoc(null)}
        title={`Invite manager${inviteLoc?.name ? ` — ${inviteLoc.name}` : ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteLoc(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={inviting} onClick={handleInviteManager}>
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-caption text-brand-muted">
            Sends an account invite. The recipient sets a password and becomes a Manager scoped to this location.
          </p>
          <FormField label="Manager email" required hint="They’ll receive an invite link to accept.">
            <Input
              type="email"
              placeholder="manager@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
