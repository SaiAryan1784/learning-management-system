import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Modal } from "../../components/ui/Modal";

/**
 * Assign a Path to staff — the course-level sibling of `CourseAssignStaff`,
 * and a deliberate copy of its plain-React table.
 *
 * DO NOT reintroduce jQuery DataTables here: pairing it with React-driven row
 * checkboxes is what caused the "Assign (0)" bug (DataTables takes DOM
 * ownership of the table, desyncing clicks from `selected` state).
 */
export default function PathAssignStaff() {
  const { pathId } = useParams();

  const [path, setPath] = useState(null);
  const [staff, setStaff] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [staffRes, pathRes, enrolRes] = await Promise.all([
        api.get("/staff"),
        api.get(`/paths/${pathId}`),
        api.get(`/paths/${pathId}/enrolments`),
      ]);
      setStaff((staffRes.data.staff || []).filter((s) => s.inviteStatus === "accepted"));
      setPath(pathRes.data.path || null);
      setEnrolled(enrolRes.data.enrolments || []);
    } catch (err) {
      if (err.response) toastr.error("Failed to load staff");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const enrolledById = new Map(
    enrolled.map((e) => [String(e.staff?._id), e]),
  );

  const filteredStaff = staff.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.user?.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const handleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const handleSelectAll = (checked) =>
    setSelected(checked ? filteredStaff.map((s) => s._id) : []);

  const confirmAssign = async () => {
    if (!dueDate) return toastr.error("Please select due date");
    try {
      setLoading(true);
      const res = await api.post(`/paths/${pathId}/assign`, {
        staffIds: selected,
        dueDate: new Date(dueDate).toISOString(),
      });
      const created = res.data?.assignmentSummary?.courseRowsCreated ?? 0;
      toastr.success(
        `Path assigned — ${created} course assignment${created === 1 ? "" : "s"} created`,
      );
      setShowPopup(false);
      setSelected([]);
      setDueDate("");
      load();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Assign failed");
    } finally {
      setLoading(false);
    }
  };

  const unassign = async (staffId, name) => {
    if (
      !window.confirm(
        `Remove ${name} from this path? Courses they were assigned separately are kept.`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/paths/${pathId}/assign/${staffId}`);
      toastr.success("Removed from path");
      load();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Could not remove");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assign Path to Staff"
        subtitle={
          path
            ? `${path.title} · ${path.courseCount} course${path.courseCount === 1 ? "" : "s"}`
            : "Select staff members to assign this path"
        }
      >
        <button
          type="button"
          className={`flex items-center gap-2 text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors ${
            selected.length === 0
              ? "bg-emerald/40 cursor-not-allowed"
              : "bg-emerald hover:bg-emerald-hover"
          }`}
          onClick={() => selected.length > 0 && setShowPopup(true)}
          disabled={selected.length === 0}
        >
          <i className="fa-solid fa-user-plus text-xs"></i>
          Assign ({selected.length})
        </button>
        <Link
          to={`/dashboard/paths/${pathId}/courses`}
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
        <>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Search staff by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs px-3 py-2 text-sm border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
            />
            <p className="text-xs text-brand-muted whitespace-nowrap">
              Showing {filteredStaff.length} of {staff.length}
            </p>
          </div>

          <TableContainer>
            <table className="dataTable" width="100%">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="accent-emerald"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={
                        filteredStaff.length > 0 &&
                        filteredStaff.every((s) => selected.includes(s._id))
                      }
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Locations</th>
                  <th>On this path</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => {
                  const enrolment = enrolledById.get(String(s._id));
                  return (
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
                      <td>
                        {s.locations?.length > 0
                          ? s.locations.map((l) => l.name).join(", ")
                          : "Org Wide"}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {enrolment ? (
                          <span className="flex items-center gap-2">
                            <span className="text-emerald font-semibold text-xs">
                              {enrolment.progressPercent}%
                            </span>
                            <button
                              type="button"
                              className="text-brand-danger hover:underline text-xs"
                              onClick={() => unassign(s._id, s.user?.name || s.email)}
                            >
                              Remove
                            </button>
                          </span>
                        ) : (
                          <span className="text-brand-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-brand-muted text-sm py-6">
                      No staff match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>
        </>
      )}

      <Modal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title="Assign Path"
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold text-brand-muted bg-canvas border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors"
              onClick={() => setShowPopup(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
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
          Assigning{" "}
          <span className="font-semibold text-brand-text">
            {path?.courseCount ?? 0} course{path?.courseCount === 1 ? "" : "s"}
          </span>{" "}
          to <span className="font-semibold text-brand-text">{selected.length}</span> staff
          member{selected.length !== 1 ? "s" : ""}.
        </p>
        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
            Due Date
          </label>
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
