import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader, Card, Button, Badge, Modal, EmptyState, SkeletonCard } from "../../components/ui";
import FilePreview from "../../components/lesson/FilePreview";

const FILE_BASE_URL = (api.defaults.baseURL || "").replace("/api", "");
const toAbsoluteUrl = (u) => (!u ? "" : u.startsWith("http") ? u : `${FILE_BASE_URL}${u}`);

const inputClass =
  "w-full px-3.5 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";

const STATUS_TONE = { active: "success", expired: "warning", revoked: "danger", renewed: "neutral" };
const STATUS_FILTERS = ["all", "active", "expired", "revoked"];

const emptyDesign = {
  enabled: true,
  mode: "template",
  designUrl: "",
  designType: "image",
  title: "Certificate of Completion",
  signatoryName: "",
  signatoryRole: "",
  logoUrl: "",
};

export default function CertificateManager() {
  const navigate = useNavigate();
  const [view, setView] = useState("issued"); // issued | designs
  const [certificates, setCertificates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ staffId: "", courseId: "" });
  const [issuing, setIssuing] = useState(false);

  // Design editing
  const [designCourse, setDesignCourse] = useState(null);
  const [designForm, setDesignForm] = useState(emptyDesign);
  const [savingDesign, setSavingDesign] = useState(false);
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [templateConfigured, setTemplateConfigured] = useState(true);

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
      // Has the org configured its default certificate template yet?
      api
        .get("/organization/settings")
        .then((r) => {
          const c = r.data.organization?.certificateSettings || {};
          setTemplateConfigured(!!(c.templateUrl || c.logoUrl || c.signatoryName));
        })
        .catch(() => {});
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

  /* ── Design editing ── */

  const openDesign = async (course) => {
    setDesignCourse(course);
    setDesignForm(emptyDesign); // optimistic; replaced once detail loads
    try {
      const res = await api.get(`/courses/${course._id}`);
      const c = (res.data.course || res.data).certificate || {};
      setDesignForm({
        enabled: c.enabled ?? true,
        mode: c.mode || "template",
        designUrl: c.designUrl || "",
        designType: c.designType || "image",
        title: c.title || "Certificate of Completion",
        signatoryName: c.signatoryName || "",
        signatoryRole: c.signatoryRole || "",
        logoUrl: c.logoUrl || "",
      });
    } catch {
      toastr.error("Failed to load course certificate config");
    }
  };

  const setDesign = (patch) => setDesignForm((p) => ({ ...p, ...patch }));

  const handleDesignUpload = async (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    const fd = new FormData();
    fd.append("file", file);
    try {
      setUploadingDesign(true);
      const res = await api.post(`/uploads/lessons/file/${isPdf ? "document" : "image"}`, fd);
      setDesign({ designUrl: res.data.publicUrl, designType: isPdf ? "pdf" : "image" });
      toastr.success("Design uploaded");
    } catch {
      toastr.error("Upload failed");
    } finally {
      setUploadingDesign(false);
    }
  };

  const saveDesign = async () => {
    try {
      setSavingDesign(true);
      await api.put(`/courses/${designCourse._id}`, { certificate: designForm });
      toastr.success("Certificate design saved");
      setDesignCourse(null);
      await load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    } finally {
      setSavingDesign(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Manage Certificates" subtitle="Issued certificates and per-course certificate designs">
        <Button
          variant="ghost"
          size="sm"
          className="!text-white !border-white/20 hover:!bg-white/10"
          leadingIcon={<i className="fa-solid fa-sliders text-xs" />}
          onClick={() => navigate("/dashboard/certificates/setup")}
        >
          Template Setup
        </Button>
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

      {!templateConfigured && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            <i className="fa-solid fa-triangle-exclamation mr-2" />
            No certificate template set up yet — courses will use the built-in default.
          </p>
          <button
            className="text-sm font-semibold text-amber-900 hover:underline whitespace-nowrap"
            onClick={() => navigate("/dashboard/certificates/setup")}
          >
            Configure template →
          </button>
        </div>
      )}

      {/* View tabs */}
      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
        {[
          { v: "issued", label: "Issued", icon: "fa-certificate" },
          { v: "designs", label: "Certificate Designs", icon: "fa-palette" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setView(t.v)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === t.v ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
          >
            <i className={`fa-solid ${t.icon} mr-1.5 text-xs`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ISSUED ── */}
      {view === "issued" && (
        <>
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
                      <td className="px-4 py-3 text-brand-text">{cert.subject?.title || cert.course?.title || "—"}</td>
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
        </>
      )}

      {/* ── DESIGNS ── */}
      {view === "designs" && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon={<i className="fa-solid fa-palette" />} title="No courses" description="Create a course first to configure its certificate." />
          </Card>
        ) : (
          <Card padded={false} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-caption text-brand-muted border-b border-brand-border">
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Certificate</th>
                  <th className="px-4 py-3 font-semibold">Design</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const cfg = c.certificate || {};
                  const enabled = cfg.enabled !== false;
                  const mode = cfg.mode || "template";
                  return (
                    <tr key={c._id} className="border-b border-brand-border last:border-0">
                      <td className="px-4 py-3 text-brand-text font-medium">{c.title}</td>
                      <td className="px-4 py-3">
                        <Badge tone={enabled ? "success" : "neutral"} size="sm">{enabled ? "On" : "Off"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={mode === "upload" ? "info" : "neutral"} size="sm" className="capitalize">
                          {mode === "upload" ? "Uploaded design" : "Template"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-semibold text-emerald hover:underline" onClick={() => openDesign(c)}>
                          <i className="fa-solid fa-pen mr-1 text-[10px]" />Edit design
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* Issue modal */}
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

      {/* Design edit modal */}
      <Modal isOpen={!!designCourse} onClose={() => setDesignCourse(null)} title={`Certificate Design — ${designCourse?.title || ""}`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <p className="text-caption text-brand-muted">
            Overrides for this course only. Anything left blank falls back to your{" "}
            <button className="font-semibold text-emerald hover:underline" onClick={() => navigate("/dashboard/certificates/setup")}>
              organization template
            </button>.
          </p>
          <label className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
            <input type="checkbox" className="accent-emerald w-4 h-4" checked={designForm.enabled} onChange={(e) => setDesign({ enabled: e.target.checked })} />
            Grant a certificate on completion
          </label>

          {designForm.enabled && (
            <>
              {/* Mode toggle */}
              <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
                {[
                  { v: "template", label: "Template", icon: "fa-wand-magic-sparkles" },
                  { v: "upload", label: "Upload your own", icon: "fa-cloud-arrow-up" },
                ].map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setDesign({ mode: m.v })}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${designForm.mode === m.v ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
                  >
                    <i className={`fa-solid ${m.icon} mr-1.5 text-xs`} />
                    {m.label}
                  </button>
                ))}
              </div>

              {designForm.mode === "upload" ? (
                <div className="space-y-3">
                  <p className="text-caption text-brand-muted">
                    Upload your finished certificate design (PNG, JPG, or PDF — e.g. from Canva). Shown to every recipient as-is and downloadable.
                  </p>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50 w-fit">
                    <i className="fa-solid fa-cloud-arrow-up text-icon" />
                    {designForm.designUrl ? "Replace design" : "Upload design"}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleDesignUpload(e.target.files?.[0])} />
                  </label>
                  {uploadingDesign ? (
                    <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-6 text-xs text-brand-muted">
                      <i className="fa-solid fa-spinner fa-spin" /> Uploading…
                    </div>
                  ) : designForm.designUrl ? (
                    <FilePreview
                      src={toAbsoluteUrl(designForm.designUrl)}
                      fileName="Certificate design"
                      height={260}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Certificate Title</label>
                    <input className={inputClass} value={designForm.title} onChange={(e) => setDesign({ title: e.target.value })} placeholder="Certificate of Completion" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Signatory Name</label>
                      <input className={inputClass} value={designForm.signatoryName} onChange={(e) => setDesign({ signatoryName: e.target.value })} placeholder="e.g. Jane Smith" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Signatory Role</label>
                      <input className={inputClass} value={designForm.signatoryRole} onChange={(e) => setDesign({ signatoryRole: e.target.value })} placeholder="e.g. Training Director" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Logo URL (optional)</label>
                    <input className={inputClass} value={designForm.logoUrl} onChange={(e) => setDesign({ logoUrl: e.target.value })} placeholder="https://… or /images/your-logo.png" />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDesignCourse(null)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={savingDesign} onClick={saveDesign}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
