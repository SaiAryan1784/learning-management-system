import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader, Card, Button, Badge, Modal, EmptyState, SkeletonCard } from "../../components/ui";

const inputClass =
  "w-full px-3.5 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";

const STATUS_TONE = { active: "success", expired: "warning", revoked: "danger", renewed: "neutral" };
const STATUS_FILTERS = ["all", "active", "expired", "revoked"];

export default function CertificateManager() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ staffId: "", courseId: "" });
  const [issuing, setIssuing] = useState(false);

  const load = async () => {
    try {
      const [certRes, staffRes, courseRes] = await Promise.all([
        api.get("/certificates/org"),
        api.get("/staff").catch(() => ({ data: { staff: [] } })),
        api.get("/courses").catch(() => ({ data: { courses: [] } })),
      ]);
      setCertificates(certRes.data.certificates || []);
      setStaff((staffRes.data.staff || []).filter((s) => s.inviteStatus === "accepted"));
      setCourses(courseRes.data.courses || []);
    } catch {
      toastr.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = certificates.filter((c) => statusFilter === "all" || c.status === statusFilter);

  const handleIssue = async () => {
    if (!issueForm.staffId || !issueForm.courseId) return toastr.warning("Select a staff member and a course");
    try {
      setIssuing(true);
      await api.post("/certificates/issue", issueForm);
      toastr.success("Certificate issued");
      setIssueOpen(false);
      setIssueForm({ staffId: "", courseId: "" });
      await load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Could not issue certificate");
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async (cert) => {
    if (!window.confirm(`Revoke this certificate for ${cert.staff?.name || "this staff member"}?`)) return;
    try {
      await api.post(`/certificates/${cert._id}/revoke`);
      toastr.success("Certificate revoked");
      await load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Revoke failed");
    }
  };

  const staffName = (s) => s.name || s.user?.name || s.email || "Unknown";

  return (
    <div className="space-y-5">
      <PageHeader title="Manage Certificates" subtitle="All issued certificates across your organization">
        <Button
          variant="ghost"
          size="sm"
          className="!text-white !border-white/20 hover:!bg-white/10"
          leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
          onClick={() => navigate("/dashboard/certificates")}
        >
          Back
        </Button>
      </PageHeader>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${statusFilter === s ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" leadingIcon={<i className="fa-solid fa-plus text-xs" />} onClick={() => setIssueOpen(true)}>
          Issue Certificate
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon={<i className="fa-solid fa-certificate" />} title="No certificates" description="No certificates match this filter yet." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-caption text-brand-muted border-b border-brand-border">
                <th className="px-4 py-3 font-semibold">Staff</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Issued</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cert) => (
                <tr key={cert._id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 text-brand-text font-medium">{cert.staff?.name || "—"}</td>
                  <td className="px-4 py-3 text-brand-text">{cert.course?.title || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[cert.status] || "neutral"} size="sm" className="capitalize">{cert.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-brand-muted">{cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {cert.status === "active" && (
                      <button className="text-xs font-semibold text-brand-danger hover:underline" onClick={() => handleRevoke(cert)}>
                        <i className="fa-solid fa-ban mr-1 text-[10px]" />Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Certificate" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-caption text-brand-muted">Manually award a certificate. This bypasses the normal completion requirement.</p>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Staff Member</label>
            <select className={inputClass} value={issueForm.staffId} onChange={(e) => setIssueForm((p) => ({ ...p, staffId: e.target.value }))}>
              <option value="">Select staff…</option>
              {staff.map((s) => <option key={s._id} value={s._id}>{staffName(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Course</label>
            <select className={inputClass} value={issueForm.courseId} onChange={(e) => setIssueForm((p) => ({ ...p, courseId: e.target.value }))}>
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIssueOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={issuing} onClick={handleIssue}>Issue</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
