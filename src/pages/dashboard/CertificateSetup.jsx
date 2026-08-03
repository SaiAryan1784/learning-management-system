import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader, Card, Button } from "../../components/ui";
import FilePreview from "../../components/lesson/FilePreview";
import { CERT_FONTS } from "../staff/StaffCertificates";

const FILE_BASE_URL = (api.defaults.baseURL || "").replace("/api", "");
const toAbsoluteUrl = (u) => (!u ? "" : u.startsWith("http") ? u : `${FILE_BASE_URL}${u}`);

const inputClass =
  "w-full px-3.5 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";

const FONT_OPTIONS = [
  { v: "serif", label: "Classic Serif" },
  { v: "sans", label: "Modern Sans" },
  { v: "mono", label: "Monospace" },
];

const empty = {
  logoUrl: "",
  title: "Certificate of Completion",
  signatoryName: "",
  signatoryRole: "",
  primaryColor: "#10B981",
  fontStyle: "serif",
  templateUrl: "",
  templateType: "image",
};

// One-time, org-wide certificate template setup (separate from issuance). Owners configure
// the default look here; every course inherits it unless it sets its own override.
export default function CertificateSetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("template"); // template | upload
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  useEffect(() => {
    api
      .get("/organization/settings")
      .then((res) => {
        const cfg = res.data.organization?.certificateSettings;
        if (cfg) {
          setForm({ ...empty, ...cfg });
          if (cfg.templateUrl) setMode("upload");
        }
      })
      .catch(() => toastr.error("Failed to load certificate settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  const uploadFile = async (file, isPdfAllowed) => {
    const isPdf = file.type === "application/pdf";
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post(
      `/uploads/lessons/file/${isPdf ? "document" : "image"}`,
      fd,
    );
    return { url: res.data.publicUrl, type: isPdf ? "pdf" : "image" };
  };

  const handleLogo = async (file) => {
    if (!file) return;
    try {
      setUploadingLogo(true);
      const { url } = await uploadFile(file);
      set({ logoUrl: url });
      toastr.success("Logo uploaded");
    } catch {
      toastr.error("Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleTemplate = async (file) => {
    if (!file) return;
    try {
      setUploadingTemplate(true);
      const { url, type } = await uploadFile(file);
      set({ templateUrl: url, templateType: type });
      toastr.success("Template uploaded");
    } catch {
      toastr.error("Template upload failed");
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // When in "customize" mode, clear any uploaded template so the generated design is used.
      const payload =
        mode === "upload" ? form : { ...form, templateUrl: "", templateType: "image" };
      await api.put("/organization/certificate-settings", payload);
      toastr.success("Certificate template saved");
      navigate("/dashboard/certificates/manage");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Certificate Template Setup" subtitle="Set your organization's default certificate — used for every course">
        <Button
          variant="ghost"
          size="sm"
          className="!text-white !border-white/20 hover:!bg-white/10"
          leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
          onClick={() => navigate("/dashboard/certificates/manage")}
        >
          Back
        </Button>
      </PageHeader>

      {/* Option A / B toggle */}
      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
        {[
          { v: "template", label: "Customize a template", icon: "fa-wand-magic-sparkles" },
          { v: "upload", label: "Upload your own", icon: "fa-cloud-arrow-up" },
        ].map((m) => (
          <button
            key={m.v}
            onClick={() => setMode(m.v)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${mode === m.v ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
          >
            <i className={`fa-solid ${m.icon} mr-1.5 text-xs`} />
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><p className="text-sm text-brand-muted py-8 text-center">Loading…</p></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Settings ── */}
          <Card className="space-y-4">
            {mode === "upload" ? (
              <div className="space-y-3">
                <p className="text-caption text-brand-muted">
                  Upload a finished certificate (PNG, JPG, or PDF). It's shown to every recipient as-is.
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50 w-fit">
                  <i className="fa-solid fa-cloud-arrow-up text-icon" />
                  {form.templateUrl ? "Replace template" : "Upload template"}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleTemplate(e.target.files?.[0])} />
                </label>
                {uploadingTemplate ? (
                  <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-6 text-xs text-brand-muted">
                    <i className="fa-solid fa-spinner fa-spin" /> Uploading…
                  </div>
                ) : form.templateUrl ? (
                  <FilePreview
                    src={toAbsoluteUrl(form.templateUrl)}
                    mimeType={form.templateType === "pdf" ? "application/pdf" : "image/*"}
                    fileName="Certificate template"
                    height={280}
                  />
                ) : null}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Organization Logo</label>
                  <div className="flex items-center gap-3">
                    {form.logoUrl ? (
                      <img src={toAbsoluteUrl(form.logoUrl)} alt="logo" className="h-12 w-12 object-contain rounded-lg border border-brand-border bg-white" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg border border-dashed border-brand-border flex items-center justify-center text-brand-muted">
                        <i className="fa-solid fa-image" />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50">
                      <i className={`fa-solid ${uploadingLogo ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"} text-emerald`} />
                      {form.logoUrl ? "Replace logo" : "Upload logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Certificate Title</label>
                  <input className={inputClass} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Certificate of Completion" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Signatory Name</label>
                    <input className={inputClass} value={form.signatoryName} onChange={(e) => set({ signatoryName: e.target.value })} placeholder="e.g. Jane Smith" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Signatory Role</label>
                    <input className={inputClass} value={form.signatoryRole} onChange={(e) => set({ signatoryRole: e.target.value })} placeholder="e.g. Training Director" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="h-10 w-12 rounded-lg border border-brand-border bg-white cursor-pointer" />
                      <input className={inputClass} value={form.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Font Style</label>
                    <select className={inputClass} value={form.fontStyle} onChange={(e) => set({ fontStyle: e.target.value })}>
                      {FONT_OPTIONS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* ── Live preview ── */}
          <Card className="space-y-3">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Live Preview</p>
            {mode === "upload" && form.templateUrl ? (
              <FilePreview
                src={toAbsoluteUrl(form.templateUrl)}
                mimeType={form.templateType === "pdf" ? "application/pdf" : "image/*"}
                fileName="Certificate template"
                height={320}
              />
            ) : (
              <div
                className="relative overflow-hidden rounded-xl p-8 border border-brand-border bg-gradient-to-b from-canvas to-surface text-center"
                style={{ fontFamily: CERT_FONTS[form.fontStyle] || CERT_FONTS.serif }}
              >
                {form.logoUrl ? (
                  <img src={toAbsoluteUrl(form.logoUrl)} alt="logo" className="h-14 mx-auto mb-4 object-contain" />
                ) : (
                  <div className="h-14 mb-4 flex items-center justify-center text-brand-muted"><i className="fa-solid fa-award text-3xl" style={{ color: form.primaryColor }} /></div>
                )}
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">{form.title || "Certificate of Completion"}</h3>
                <div className="h-px bg-brand-border mb-4" />
                <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">This certifies that</p>
                <h2 className="text-2xl font-bold text-brand-text mb-1">Sample Learner</h2>
                <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">has successfully completed</p>
                <h3 className="text-lg font-bold mb-4" style={{ color: form.primaryColor }}>Sample Course</h3>
                <div className="h-px bg-brand-border mb-4" />
                {form.signatoryName && (
                  <div className="mt-4">
                    <div className="h-px w-40 bg-brand-border mb-1 mx-auto" />
                    <p className="text-xs font-semibold text-brand-text">{form.signatoryName}</p>
                    {form.signatoryRole && <p className="text-[10px] text-brand-muted">{form.signatoryRole}</p>}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" loading={saving} onClick={handleSave} leadingIcon={<i className="fa-solid fa-floppy-disk text-xs" />}>
          Save Template
        </Button>
      </div>
    </div>
  );
}
