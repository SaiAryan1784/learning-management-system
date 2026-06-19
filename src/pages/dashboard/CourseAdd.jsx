import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, PageLoader, Button } from "../../components/ui";
import FilePreview from "../../components/lesson/FilePreview";

const FILE_BASE_URL = (api.defaults.baseURL || "").replace("/api", "");
const toAbsoluteUrl = (u) => (!u ? "" : u.startsWith("http") ? u : `${FILE_BASE_URL}${u}`);

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

const COURSE_COLORS = ["#10B981","#3B82F6","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899","#F97316"];
function getCourseColor(title = "") {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  return COURSE_COLORS[Math.abs(h) % COURSE_COLORS.length];
}

const STEPS = ["Course Details", "Build Content", "Assign & Publish"];

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
  const fileInputRef = useRef();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [step, setStep] = useState(1);
  const [savedCourseId, setSavedCourseId] = useState(courseId || null);

  const [form, setForm] = useState({
    title: "", description: "",
    certificate: {
      enabled: true,
      mode: "template",
      designUrl: "",
      designType: "image",
      title: "Certificate of Completion",
      signatoryName: "",
      signatoryRole: "",
      logoUrl: "",
    },
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
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
    const isPdf = file.type === "application/pdf";
    const fd = new FormData();
    fd.append("file", file);
    try {
      setUploadingDesign(true);
      const res = await api.post(`/uploads/lessons/file/${isPdf ? "document" : "image"}`, fd);
      setCert({ designUrl: res.data.publicUrl, designType: isPdf ? "pdf" : "image" });
      toastr.success("Design uploaded");
    } catch {
      toastr.error("Upload failed");
    } finally {
      setUploadingDesign(false);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
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
      setStep(2);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!savedCourseId) return;
    try {
      setPublishing(true);
      await api.patch(`/courses/${savedCourseId}/publish`);
      toastr.success("Course published");
      navigate("/dashboard/courses");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <PageLoader />;

  const avatarColor = getCourseColor(form.title);
  const initials = form.title ? form.title.slice(0, 2).toUpperCase() : "CO";

  return (
    <div className="space-y-6">
      <PageHeader
        title={savedCourseId && courseId ? "Edit Course" : "New Course"}
        subtitle="Set up your course in three steps"
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
                      style={{ background: coverPreview ? undefined : avatarColor + "20" }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
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
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          <i className="fa-solid fa-camera mr-1.5" />
                          {coverPreview ? "Change" : "Upload"}
                        </span>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                    {coverPreview && (
                      <button
                        type="button"
                        className="text-xs text-brand-danger hover:underline"
                        onClick={() => { setCoverFile(null); setCoverPreview(null); }}
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
                      {/* Mode toggle: built-in template vs upload-your-own design */}
                      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
                        {[
                          { v: "template", label: "Template", icon: "fa-wand-magic-sparkles" },
                          { v: "upload", label: "Upload your own", icon: "fa-cloud-arrow-up" },
                        ].map((m) => (
                          <button
                            key={m.v}
                            type="button"
                            onClick={() => setCert({ mode: m.v })}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${form.certificate.mode === m.v ? "bg-surface text-brand-text shadow-soft" : "text-brand-muted hover:text-brand-text"}`}
                          >
                            <i className={`fa-solid ${m.icon} mr-1.5 text-xs`} />
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {form.certificate.mode === "upload" ? (
                        <div className="space-y-3">
                          <p className="text-caption text-brand-muted">
                            Upload your finished certificate design (PNG, JPG, or PDF — e.g. exported from Canva).
                            It’s shown to every recipient as-is and they can download it.
                          </p>
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-xs font-semibold text-brand-text cursor-pointer hover:border-emerald/50 w-fit">
                            <i className="fa-solid fa-cloud-arrow-up text-emerald" />
                            {form.certificate.designUrl ? "Replace design" : "Upload design"}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleDesignUpload(e.target.files?.[0])}
                            />
                          </label>
                          {uploadingDesign ? (
                            <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-6 text-xs text-brand-muted">
                              <i className="fa-solid fa-spinner fa-spin" /> Uploading…
                            </div>
                          ) : form.certificate.designUrl ? (
                            <FilePreview
                              src={toAbsoluteUrl(form.certificate.designUrl)}
                              mimeType={form.certificate.designType === "pdf" ? "application/pdf" : "image/*"}
                              fileName="Certificate design"
                              height={280}
                            />
                          ) : null}
                        </div>
                      ) : (
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

        {/* ── STEP 2: Build Content ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-surface border border-brand-border rounded-xl p-8 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center mx-auto">
                <i className="fa-solid fa-layer-group text-emerald text-2xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-text">Course saved as draft!</h2>
                <p className="text-sm text-brand-muted mt-1">Now build the content — a course is a folder of lessons. Add lessons to give your learners something to work through.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary" size="lg" fullWidth
                  leadingIcon={<i className="fa-solid fa-folder-open" />}
                  onClick={() => navigate(`/dashboard/courses/${savedCourseId}/lessons`)}
                >
                  Go to Lesson Builder
                </Button>
                <Button
                  variant="ghost" size="md" fullWidth
                  onClick={() => setStep(3)}
                >
                  Skip for now — go to Assign & Publish
                  <i className="fa-solid fa-arrow-right ml-1.5 text-xs" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Assign & Publish ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-surface border border-brand-border rounded-xl p-8 space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                <i className="fa-solid fa-users text-blue-500 text-2xl" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-brand-text">Assign & Publish</h2>
                <p className="text-sm text-brand-muted mt-1">Assign this course to staff members and publish when you're ready.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary" size="lg" fullWidth
                  leadingIcon={<i className="fa-solid fa-user-plus" />}
                  onClick={() => navigate(`/dashboard/courses/${savedCourseId}/assign`)}
                >
                  Assign to Staff
                </Button>
                <Button
                  variant="primary" size="lg" fullWidth loading={publishing}
                  leadingIcon={<i className="fa-solid fa-rocket" />}
                  onClick={handlePublish}
                >
                  Publish Course
                </Button>
                <Button
                  variant="ghost" size="md" fullWidth
                  onClick={() => navigate("/dashboard/courses")}
                >
                  <i className="fa-solid fa-check mr-1.5 text-xs" />
                  Done — View All Courses
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
