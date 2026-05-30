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

export default function OwnerLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [editId, setEditId] = useState(null);
  const [openPop, setOpenPop] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLocations = async () => {
    try {
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
    setForm({ name: loc.name, address: loc.address, phone: loc.phone });
    setOpenPop(true);
  };

  const resetForm = () => {
    setForm({ name: "", address: "", phone: "" });
    setEditId(null);
  };

  const closeModal = () => {
    setOpenPop(false);
    resetForm();
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

      <TableContainer>
        <table id="locationsTable" width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-brand-muted py-8">
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
                    <button className={actionBtn} onClick={() => handleEdit(loc)} title="Edit">
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableContainer>

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
          ].map(({ label, field, placeholder }) => (
            <FormField key={field} label={label} required>
              <Input
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </FormField>
          ))}
        </div>
      </Modal>
    </div>
  );
}
