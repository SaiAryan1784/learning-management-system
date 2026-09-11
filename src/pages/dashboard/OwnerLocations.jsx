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

const MAX_EMAILS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyForm = () => ({ name: "", address: "", phone: "", emails: [""] });
// Reads either shape, so this page works against a backend one release behind.
const locEmails = (loc) => loc.emails ?? (loc.email ? [loc.email] : []);

export default function OwnerLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Franchise-owner invite modal (explicit action, separate from create)
  const [inviteLoc, setInviteLoc] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Deletion modal
  const [deleteLoc, setDeleteLoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const setEmailAt = (i, value) =>
    setForm((f) => ({ ...f, emails: f.emails.map((e, j) => (j === i ? value : e)) }));
  const addEmailRow = () =>
    setForm((f) => (f.emails.length >= MAX_EMAILS ? f : { ...f, emails: [...f.emails, ""] }));
  const removeEmailRow = (i) =>
    setForm((f) => {
      const next = f.emails.filter((_, j) => j !== i);
      return { ...f, emails: next.length ? next : [""] };
    });

  const handleSubmit = async () => {
    // Only the name is required. Emails are optional, but any that are filled
    // in must be well formed — blank rows are simply dropped.
    if (!form.name.trim()) { toastr.error("Location name is required", "error"); return; }
    const emails = form.emails.map((e) => e.trim()).filter(Boolean);
    const bad = emails.find((e) => !EMAIL_RE.test(e));
    if (bad) { toastr.error(`"${bad}" is not a valid email`, "error"); return; }

    const payload = { name: form.name, address: form.address, phone: form.phone, emails, email: emails[0] || "" };

    try {
      setSubmitting(true);
      if (editId) {
        await api.put(`/locations/${editId}`, payload);
        toastr.success("Location updated successfully!", "success");
      } else {
        await api.post("/locations", payload);
        toastr.success("Location added successfully!", "success");
      }
      resetForm();
      setOpenPop(false);
      loadLocations();
    } catch (err) {
      toastr.error(
        err.response?.data?.error || err.response?.data?.message || "Something went wrong. Try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (loc) => {
    setEditId(loc._id);
    setForm({
      name: loc.name,
      address: loc.address || "",
      phone: loc.phone || "",
      emails: locEmails(loc).length ? [...locEmails(loc)] : [""],
    });
    setOpenPop(true);
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditId(null);
  };

  const closeModal = () => {
    setOpenPop(false);
    resetForm();
  };

  const openInvite = (loc) => {
    setInviteLoc(loc);
    setInviteEmail(locEmails(loc)[0] || "");
  };

  const handleInviteManager = async () => {
    if (!inviteEmail.trim() || !EMAIL_RE.test(inviteEmail.trim())) {
      toastr.error("Enter a valid email", "error");
      return;
    }
    try {
      setInviting(true);
      await api.post(`/locations/${inviteLoc._id}/invite-manager`, { email: inviteEmail.trim() });
      toastr.success("Franchise owner invite sent!", "success");
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

  const handleDeleteLocation = async () => {
    if (!deleteLoc) return;
    try {
      setDeleting(true);
      await api.delete(`/locations/${deleteLoc._id}`);
      toastr.success("Location deleted successfully!", "success");
      setDeleteLoc(null);
      loadLocations();
    } catch (err) {
      console.error("Error deleting location:", err);
      toastr.error(
        err.response?.data?.error || err.response?.data?.message || "Failed to delete location.",
        "error"
      );
    } finally {
      setDeleting(false);
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
              <th>Emails</th>
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
                  <td>
                    {locEmails(loc).length ? (
                      <div className="flex flex-col gap-0.5">
                        {locEmails(loc).map((e) => (
                          <span key={e} className="text-sm">{e}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className={actionBtn} onClick={() => handleEdit(loc)} title="Edit">
                        <i className="fa-solid fa-edit text-xs"></i>
                      </button>
                      <button className={actionBtn} onClick={() => openInvite(loc)} title="Invite franchise owner">
                        <i className="fa-solid fa-user-plus text-xs"></i>
                      </button>
                      <button
                        className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger transition-colors`}
                        onClick={() => setDeleteLoc(loc)}
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
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
            { label: "Location Name", field: "name", placeholder: "e.g. Head Office", required: true },
            { label: "Address", field: "address", placeholder: "123 Main Street" },
            { label: "Phone", field: "phone", placeholder: "+1 555 000 0000" },
          ].map(({ label, field, placeholder, required }) => (
            <FormField key={field} label={label} required={required}>
              <Input
                type="text"
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </FormField>
          ))}

          <FormField
            label="Contact emails"
            hint={`Up to ${MAX_EMAILS}. The first one is offered by default when you invite the franchise owner.`}
          >
            <div className="space-y-2">
              {form.emails.map((value, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder={i === 0 ? "location@example.com" : "another@example.com"}
                    value={value}
                    onChange={(e) => setEmailAt(i, e.target.value)}
                  />
                  {form.emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailRow(i)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
                      title="Remove this email"
                      aria-label="Remove this email"
                    >
                      <i className="fa-solid fa-xmark text-xs" />
                    </button>
                  )}
                </div>
              ))}
              {form.emails.length < MAX_EMAILS && (
                <button
                  type="button"
                  onClick={addEmailRow}
                  className="text-sm font-semibold text-emerald hover:underline"
                >
                  <i className="fa-solid fa-plus text-xs mr-1.5" />
                  Add another email
                </button>
              )}
            </div>
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={!!inviteLoc}
        onClose={() => setInviteLoc(null)}
        title={`Invite franchise owner${inviteLoc?.name ? ` — ${inviteLoc.name}` : ""}`}
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
            Sends an account invite. The recipient sets a password and becomes the Franchise Owner of this location — they can onboard and manage their own staff here, and cannot edit corporate courses.
          </p>
          <FormField label="Franchise owner email" required hint="They’ll receive an invite link to accept.">
            <Input
              type="email"
              placeholder="owner@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteLoc}
        onClose={() => setDeleteLoc(null)}
        title={`Delete Location${deleteLoc?.name ? ` — ${deleteLoc.name}` : ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteLoc(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteLocation}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-caption text-brand-danger font-semibold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Warning: This action is permanent and cannot be undone.
          </p>
          <p className="text-caption text-brand-muted">
            Deleting this location will automatically remove it from any assigned staff members and scoped compliance policies.
          </p>
        </div>
      </Modal>
    </div>
  );
}
