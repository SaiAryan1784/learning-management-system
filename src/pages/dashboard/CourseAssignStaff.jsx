import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";

export default function CourseAssign() {
  const { courseId } = useParams();

  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await api.get("/staff");
      const accepted = (res.data.staff || []).filter((s) => s.inviteStatus === "accepted");
      setStaff(accepted);
    } catch (err) {
      if (err.response) toastr.error("Failed to load staff");
    }
  };

  useEffect(() => { loadStaff(); }, []);

  useEffect(() => {
    if (staff.length === 0) return;
    const timer = setTimeout(() => {
      if ($.fn.DataTable.isDataTable("#staffTable")) {
        $("#staffTable").DataTable().destroy();
      }
      $("#staffTable").DataTable({ pageLength: 10 });
    }, 100);
    return () => {
      clearTimeout(timer);
      if ($.fn.DataTable.isDataTable("#staffTable")) {
        $("#staffTable").DataTable().destroy();
      }
    };
  }, [staff]);

  const handleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSelectAll = (checked) => setSelected(checked ? staff.map((s) => s._id) : []);

  const confirmAssign = async () => {
    if (!dueDate) return toastr.error("Please select due date");
    try {
      setLoading(true);
      await api.post(`/courses/${courseId}/assign`, {
        staffIds: selected,
        dueDate: new Date(dueDate).toISOString(),
      });
      toastr.success("Course assigned successfully");
      setShowPopup(false);
      setSelected([]);
      setDueDate("");
      setTimeout(() => loadStaff(), 300);
    } catch (err) {
      if (err.response?.status === 409) {
        toastr.warning("Some selected staff were already assigned. Due date updated.");
      } else {
        toastr.error(err.response?.data?.error || "Assign failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Assign Course to Staff" subtitle="Select staff members to assign this course">
        <button
          className={`flex items-center gap-2 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors ${selected.length === 0 ? "bg-emerald/40 cursor-not-allowed" : "bg-emerald hover:bg-emerald-hover"}`}
          onClick={() => selected.length > 0 && setShowPopup(true)}
          disabled={selected.length === 0}
        >
          <i className="fa-solid fa-user-plus text-xs"></i>
          Assign ({selected.length})
        </button>
        <Link
          to="/dashboard/courses"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {staff.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-users text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No accepted staff available.</p>
        </div>
      ) : (
        <TableContainer>
          <table key={staff.length} id="staffTable" width="100%">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="accent-emerald"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selected.length === staff.length && staff.length > 0}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Locations</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s._id}
                  className={selected.includes(s._id) ? "bg-emerald/5" : ""}
                  onClick={() => handleSelect(s._id)}
                  style={{ cursor: "pointer" }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="accent-emerald"
                      checked={selected.includes(s._id)}
                      onChange={() => handleSelect(s._id)}
                    />
                  </td>
                  <td>{s.user?.name || "—"}</td>
                  <td>{s.email}</td>
                  <td>{s.role?.name || "—"}</td>
                  <td>{s.locations?.length > 0 ? s.locations.map((l) => l.name).join(", ") : "Org Wide"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}

      <Modal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title="Assign Course"
        footer={
          <>
            <button
              className="px-4 py-2 text-sm font-semibold text-brand-muted bg-canvas border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors"
              onClick={() => setShowPopup(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors disabled:opacity-50"
              onClick={confirmAssign}
              disabled={loading}
            >
              {loading ? "Assigning..." : "Assign"}
            </button>
          </>
        }
      >
        <p className="text-sm text-brand-muted mb-4">
          Assigning course to <span className="font-semibold text-brand-text">{selected.length}</span> staff member{selected.length !== 1 ? "s" : ""}.
        </p>
        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Due Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
