import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, PageLoader, Button } from "../../components/ui";
import FilePreview from "../../components/lesson/FilePreview";
import { getCourseColor } from "../../utils/courseColor";
import { onFilePick } from "../../utils/fileInput";

const FILE_BASE_URL = (api.defaults.baseURL || "").replace("/api", "");
const toAbsoluteUrl = (u) => (!u ? "" : u.startsWith("http") ? u : `${FILE_BASE_URL}${u}`);

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

const STEPS = ["Course Details", "Build Content"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={[
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-colors",
                done ? "bg-emerald border-emerald text-white" :
                active ? "border-emerald text-emerald bg-emerald/10" :
                "border-brand-border text-brand-muted",
              ].join(" ")}>
                {done ? <i className="fa-solid fa-check text-[10px]" /> : n}
              </div>
              <span className={`text-xs font-semibold hidden sm:block whitespace-nowrap ${active ? "text-brand-text" : "text-brand-muted"}`}>
                {label}
              </span>
            </div>
            {n < STEPS.length && (
              <div className={`flex-1 h-px mx-3 transition-colors ${done ? "bg-emerald" : "bg-brand-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CourseAdd() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  // Set when this page was opened from inside a Path ("Create new course").
  // The course still stands on its own — the path just gains a reference to it.
  const [searchParams] = useSearchParams();
  const fromPathId = searchParams.get("pathId");
  const fileInputRef = useRef();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [savedCourseId, setSavedCourseId] = useState(courseId || null);

  const [form, setForm] = useState({
    title: "", description: "",
    coverImageUrl: "",
    certificate: {
      enabled: true,
      mode: "",
      designUrl: "",
      designType: "image",
      title: "Certificate of Completion",
      signatoryName: "",
      signatoryRole: "",
      logoUrl: "",
    },
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDesign, setUploadingDesign] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    const loadCourse = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}`);
        const d = res.data.course || res.data;
        setForm({
          title: d.title,
          description: d.description,
          coverImageUrl: d.coverImageUrl || "",
          certificate: {
            enabled: d.certificate?.enabled ?? true,
            mode: d.certificate?.mode || "template",
            designUrl: d.certificate?.designUrl || "",
            designType: d.certificate?.designType || "image",
            title: d.certificate?.title || "Certificate of Completion",
            signatoryName: d.certificate?.signatoryName || "",
            signatoryRole: d.certificate?.signatoryRole || "",
            logoUrl: d.certificate?.logoUrl || "",
          },
        });
        setSavedCourseId(d._id);
      } catch {
        toastr.error("Failed to load course");
      }
      setLoading(false);
    };
    loadCourse();
  }, [courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const setCert = (patch) =>
    setForm((p) => ({ ...p, certificate: { ...p.certificate, ...patch } }));

  const handleDesignUpload = async (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toastr.error("File is larger than 25 MB — compress it and try again");
      return;
    }
    const isPdf = file.type === "application/pdf";
    const fd = new FormData();
    fd.append("file", file);
    try {
      setUploadingDesign(true);
      const res = await api.post(`/uploads/lessons/file/${isPdf ? "document" : "image"}`, fd);
      setCert({ designUrl: res.data.publicUrl, designType: isPdf ? "pdf" : "image" });
      toastr.success("Design uploaded");
    } catch (err) {
      const status = err.response?.status;
      toastr.error(
        status === 413
          ? "File too large (max 25 MB)"
          : !err.response
          ? "Upload blocked — file may be too large or the server is unreachable"
          : err.response.data?.message || "Upload failed"
      );
    } finally {
      setUploadingDesign(false);
    }
  };

  /**
   * Upload the cover the moment it is chosen, and keep only the returned URL.
   *
   * This used to stash the File in state and show an `URL.createObjectURL`
   * preview that was never uploaded and never saved — the image looked applied,
   * then vanished on reload. Uploading on select (the same thing the
   * certificate design field above does) means what you see is what is stored.
   */
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so re-picking the same file still fires a change event.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toastr.error("Cover must be an image (PNG, JPG or WebP)");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toastr.error("Image is larger than 25 MB — compress it and try again");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    try {
      setUploadingCover(true);
      const res = await api.post("/uploads/lessons/file/image", fd);
      setForm((p) => ({ ...p, coverImageUrl: res.data.publicUrl }));
      toastr.success("Cover uploaded — save the course to keep it");
    } catch (err) {
      const status = err.response?.status;
      toastr.error(
        status === 413
          ? "Image too large (max 25 MB)"
          : !err.response
          ? "Upload blocked — the image may be too large or the server is unreachable"
          : err.response.data?.message || "Upload failed"
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toastr.error("Title is required");
    try {
      setSubmitting(true);
      let res;
      if (savedCourseId) {
        res = await api.put(`/courses/${savedCourseId}`, form);
        toastr.success("Course updated");
      } else {
        res = await api.post("/courses", form);
        toastr.success("Course saved as draft");
      }
      const id = savedCourseId || res.data.course?._id || res.data._id;
      setSavedCourseId(id);

      // Created from a path: add the reference, then hand the admin back to
      // the path so the new course is visible in the order they were building.
      if (fromPathId && !savedCourseId) {
        try {
          await api.post(`/paths/${fromPathId}/courses`, { courseIds: [id] });
          toastr.success("Added to the path");
          navigate(`/dashboard/paths/${fromPathId}/courses`);
          return;
        } catch {
          // The course itself saved fine — say so rather than implying it didn't.
          toastr.warning("Course saved, but it could not be added to the path");
        }
      }

      navigate(`/dashboard/courses/${id}/lessons`);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const avatarColor = getCourseColor(form.title);
  const initials = form.title ? form.title.slice(0, 2).toUpperCase() : "CO";

  return (
    <div className="space-y-6">
      <PageHeader
        title={savedCourseId && courseId ? "Edit Course" : "New Course"}
        subtitle="Set up your course in two steps"
      >
        <Button
          type="button" variant="ghost" size="sm"
          className="!text-white !border-white/20 hover:!bg-white/10"
          leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
          onClick={() => navigate("/dashboard/courses")}
        >
          Back
        </Button>
      </PageHeader>

      {/* Step indicator */}
      <div className="bg-surface border border-brand-border rounded-xl p-5">
        <StepIndicator current={step} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Course Details ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleStep1Submit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Cover image */}
                <div className="lg:col-span-1">
                  <div className="bg-surface border border-brand-border rounded-xl p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Cover Image</h3>
                    <div
                      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer group"
                      style={{ background: form.coverImageUrl ? undefined : avatarColor + "20" }}
                      onClick={() => !uploadingCover && fileInputRef.current?.click()}
                    >
                      {form.coverImageUrl ? (
                        <img
                          src={toAbsoluteUrl(form.coverImageUrl)}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </div>
                          <p className="text-xs text-brand-muted">Click to upload cover</p>
                        </div>
                      )}
                      {uploadingCover ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            <i className="fa-solid fa-spinner fa-spin mr-1.5" />
                            Uploading…
                          </span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            <i className="fa-solid fa-camera mr-1.5" />
                            {form.coverImageUrl ? "Change" : "Upload"}
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                    <p className="text-[11px] text-brand-muted">
                      Shown on the course card. Landscape (16:9) works best.
                    </p>
                    {form.coverImageUrl && !uploadingCover && (
                      <button
                        type="button"
                        className="text-xs text-brand-danger hover:underline"
                        onClick={() => setForm((p) => ({ ...p, coverImageUrl: "" }))}
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                {/* Course info */}
                <div className="lg:col-span-2 bg-surface border border-brand-border rounded-xl p-6 space-y-4">
                  <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wide border-b border-brand-border pb-2">Course Info</h3>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Course Title <span className="text-brand-danger">*</span></label>
                    <input className={inputClass} type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Fire Safety Fundamentals" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
                    <textarea className={inputClass} rows={4} name="description" value={form.description} onChange={handleChange} placeholder="What will learners gain from this course?" />
                  </div>
                </div>

                {/* Certificate settings */}
                <div className="lg:col-span-3 bg-surface border border-brand-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border pb-2">
                    <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Certificate</h3>
                    <label className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-emerald w-4 h-4"
                        checked={form.certificate.enabled}
                        onChange={(e) => setCert({ enabled: e.target.checked })}
                      />
                      Grant a certificate on completion
                    </label>
                  </div>
                  {form.certificate.enabled && (
                    <div className="space-y-4">
                      {/* One-time certificate type choice */}
                      {!form.certificate.mode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { v: "template", label: "Use a template", desc: "Fill in your title, signatory, and logo — we generate a polished certificate.", icon: "fa-wand-magic-sparkles" },
                            { v: "upload", label: "Upload your own", desc: "Upload a finished design from Canva or any tool (PNG, JPG, or PDF).", icon: "fa-cloud-arrow-up" },
                          ].map((m) => (
                            <button
                              key={m.v}
                              type="button"
                              onClick={() => setCert({ mode: m.v })}
                              className="text-left p-5 rounded-xl border-2 border-brand-border hover:border-emerald/50 bg-surface transition-colors"
                            >
                              <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center mb-3">
                                <i className={`fa-solid ${m.icon} text-emerald`} />
                              </div>
                              <p className="text-body font-semibold text-brand-text mb-1">{m.label}</p>
                              <p className="text-caption text-brand-muted">{m.desc}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {form.certificate.mode === "upload" && (
                        <div className="space-y-3">
                          <p className="text-caption text-brand-muted">
                            Upload your finished certificate design (PNG, JPG, or PDF — e.g. exported from Canva).
                            It’s shown to every recipient as-is and they can download it.
                          </p>
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50 w-fit">
                            <i className="fa-solid fa-cloud-arrow-up text-icon" />
                            {form.certificate.designUrl ? "Replace design" : "Upload design"}
                            <input
                              type="file"
                              accept="image/*,.pdf,application/pdf"
                              className="hidden"
                              onChange={onFilePick(handleDesignUpload)}
                            />
                          </label>
                          {uploadingDesign ? (
                            <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-6 text-xs text-brand-muted">
                              <i className="fa-solid fa-spinner fa-spin" /> Uploading…
                            </div>
                          ) : form.certificate.designUrl ? (
                            <FilePreview
                              src={toAbsoluteUrl(form.certificate.designUrl)}
                              fileName="Certificate design"
                              height={280}
                            />
                          ) : null}
                          <div className="pt-2 mt-1 border-t border-brand-border">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              leadingIcon={<i className="fa-solid fa-rotate text-[10px]" />}
                              onClick={() => setCert({ mode: "" })}
                            >
                              Change certificate type
                            </Button>
                          </div>
                        </div>
                      )}

                      {form.certificate.mode === "template" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Certificate Title</label>
                            <input className={inputClass} value={form.certificate.title} onChange={(e) => setCert({ title: e.target.value })} placeholder="Certificate of Completion" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Signatory Name</label>
                            <input className={inputClass} value={form.certificate.signatoryName} onChange={(e) => setCert({ signatoryName: e.target.value })} placeholder="e.g. Jane Smith" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Signatory Role</label>
                            <input className={inputClass} value={form.certificate.signatoryRole} onChange={(e) => setCert({ signatoryRole: e.target.value })} placeholder="e.g. Training Director" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Logo URL (optional)</label>
                            <input className={inputClass} value={form.certificate.logoUrl} onChange={(e) => setCert({ logoUrl: e.target.value })} placeholder="https://… or /images/your-logo.png" />
                          </div>
                          <div className="md:col-span-2 pt-2 mt-1 border-t border-brand-border">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              leadingIcon={<i className="fa-solid fa-rotate text-[10px]" />}
                              onClick={() => setCert({ mode: "" })}
                            >
                              Change certificate type
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-3 flex justify-end pt-2">
                  <Button type="submit" variant="primary" loading={submitting} trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />}>
                    Save & Continue
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
