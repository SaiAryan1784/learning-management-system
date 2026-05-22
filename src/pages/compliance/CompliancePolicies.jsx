import { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function CompliancePolicies() {
  const [policies, setPolicies] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("addPolicy");
  const [loading, setLoading] = useState(false);
  const tableRef = useRef();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", courseIds: [], orgWide: true,
    locationIds: [], autoAssignOnStaffOnboarding: true, dueDays: 30,
  });

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/compliance/policies");
      setPolicies(res.data.policies || []);
    } catch {
      toastr.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get("/courses?active=true");
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Failed to load courses");
    }
  };

  useEffect(() => { loadPolicies(); loadCourses(); }, []);

  useEffect(() => {
    if (activeTab === "policyList" && policies.length > 0) {
      if ($.fn.DataTable.isDataTable("#policyTable")) {
        $("#policyTable").DataTable().destroy();
      }
      setTimeout(() => {
        $("#policyTable").DataTable({ pageLength: 5, lengthMenu: [5, 10, 25] });
      }, 0);
    }
  }, [activeTab, policies]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleCourse = (courseId) => {
    setForm((prev) => {
      const updated = prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId];
      return { ...prev, courseIds: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description, courseIds: form.courseIds,
      orgWide: form.orgWide, locationIds: [], autoAssignOnStaffOnboarding: form.autoAssignOnStaffOnboarding,
      dueDays: Number(form.dueDays),
    };
    try {
      if (editId) {
        await api.put(`/compliance/policies/${editId}`, payload);
        toastr.success("Policy updated");
      } else {
        await api.post("/compliance/policies", payload);
        toastr.success("Policy created");
      }
      setEditId(null);
      setForm({ name: "", description: "", courseIds: [], orgWide: true, locationIds: [], autoAssignOnStaffOnboarding: true, dueDays: 30 });
      loadPolicies();
      setActiveTab("policyList");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    }
  };

  const handleEdit = (policy) => {
    setEditId(policy._id);
    setForm({
      name: policy.name || "", description: policy.description || "",
      courseIds: policy.courseIds?.map((c) => c._id) || [],
      orgWide: policy.orgWide ?? true, locationIds: policy.locationIds || [],
      autoAssignOnStaffOnboarding: policy.autoAssignOnStaffOnboarding ?? true,
      dueDays: policy.dueDays || 30,
    });
    setActiveTab("addPolicy");
  };

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Compliance Policies" subtitle="Create mandatory compliance training rules" />

      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {[{ key: "addPolicy", label: editId ? "Edit Policy" : "Add Policy" }, { key: "policyList", label: "Policy List" }].map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === key ? "bg-charcoal text-white" : "text-brand-muted hover:text-brand-text"}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "addPolicy" && (
        <div className="bg-surface border border-brand-border rounded-xl p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Policy Name</label>
              <input className={inputClass} type="text" name="name" value={form.name} onChange={handleChange} placeholder="Policy Name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
              <textarea className={inputClass} rows={4} name="description" value={form.description} onChange={handleChange} placeholder="Policy description" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Assign Courses</label>
              <div className="border border-brand-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {courses.map((course) => (
                  <label key={course._id} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-emerald w-3.5 h-3.5"
                      checked={form.courseIds.includes(course._id)}
                      onChange={() => toggleCourse(course._id)}
                    />
                    {course.title}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Due Days</label>
              <input className="w-32 px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent" type="number" name="dueDays" value={form.dueDays} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-2">
              {[
                { name: "orgWide", label: "Apply Organization Wide" },
                { name: "autoAssignOnStaffOnboarding", label: "Auto Assign On Staff Onboarding" },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                  <input type="checkbox" className="accent-emerald w-3.5 h-3.5" name={name} checked={form[name]} onChange={handleChange} />
                  {label}
                </label>
              ))}
            </div>

            <button className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors" type="submit">
              {editId ? "Update Policy" : "Create Policy"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "policyList" && (
        loading ? (
          <p className="text-brand-muted text-sm">Loading policies...</p>
        ) : (
          <TableContainer>
            <table id="policyTable" ref={tableRef} width="100%">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Courses</th>
                  <th>Due Days</th>
                  <th>Org Wide</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-brand-muted py-8">No policies created</td></tr>
                )}
                {policies.map((p) => (
                  <tr key={p._id}>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.courseIds?.map((c) => c.title).join(", ") || "—"}</td>
                    <td>{p.dueDays}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.orgWide ? "bg-emerald/10 text-emerald" : "bg-brand-muted/10 text-brand-muted"}`}>
                        {p.orgWide ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <button className={actionBtn} onClick={() => handleEdit(p)} title="Edit">
                        <i className="fa fa-edit text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )
      )}
    </div>
  );
}
