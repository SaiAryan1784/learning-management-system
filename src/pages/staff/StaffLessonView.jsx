import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { PageLoader } from "../../components/ui/Spinner";
import { Button, Badge, Card, ProgressBar } from "../../components/ui";
import { ThemeScope } from "../../contexts/BrandContext";
import FilePreview from "../../components/lesson/FilePreview";
import NumberScale from "../../components/lesson/NumberScale";
import SignaturePad from "../../components/lesson/SignaturePad";
import FlipCard from "../../components/lesson/FlipCard";
import "../../components/lesson/lessonContent.css";

const BASE_URL = api.defaults.baseURL || "";
const FILE_BASE_URL = BASE_URL.replace("/api", "");

const fileUrl = (config) => {
  if (!config) return "";
  if (config.contentUrl) return config.contentUrl.startsWith("http") ? config.contentUrl : `${FILE_BASE_URL}${config.contentUrl}`;
  if (config.storageKey) return `${FILE_BASE_URL}/uploads/${config.storageKey}`;
  return "";
};

const youtubeEmbed = (url) => {
  if (!url) return "";
  if (url.includes("youtube.com/watch")) return `https://www.youtube.com/embed/${url.split("v=")[1]?.split("&")[0]}`;
  if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]?.split("?")[0]}`;
  return url;
};

/* ── interactive field components ── */

function Accordion({ config }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-canvas text-left" onClick={() => setOpen((o) => !o)}>
        <span className="text-sm font-semibold text-brand-text">{config.title}</span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-xs text-brand-muted`}></i>
      </button>
      {open && <div className="px-4 py-3 lesson-content" dangerouslySetInnerHTML={{ __html: config.body || "" }} />}
    </div>
  );
}

function MatchingField({ config, value, onChange }) {
  // value: [{ left, right }]
  const lefts = (config.pairs || []).map((p) => p.left);
  const rights = useMemo(() => {
    const r = (config.pairs || []).map((p) => p.right);
    // stable shuffle
    return [...r].sort((a, b) => a.localeCompare(b));
  }, [config.pairs]);

  const setRightFor = (left, right) => {
    const others = (value || []).filter((v) => v.left !== left);
    onChange([...others, { left, right }]);
  };

  return (
    <div className="space-y-2">
      {lefts.map((left) => {
        const current = (value || []).find((v) => v.left === left)?.right || "";
        return (
          <div key={left} className="flex items-center gap-3">
            <span className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-brand-border text-sm">{left}</span>
            <i className="fa-solid fa-arrow-right text-brand-muted text-xs"></i>
            <select
              className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
              value={current}
              onChange={(e) => setRightFor(left, e.target.value)}
            >
              <option value="">Select match…</option>
              {rights.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

export default function StaffLessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [responses, setResponses] = useState({}); // blockId -> value
  const [quizResult, setQuizResult] = useState(null);

  const loadCourseContent = async () => {
    const res = await api.get(`/progress/me/assigned-courses/${courseId}/content`);
    setCourseData(res.data);
  };

  const loadProgress = async () => {
    const res = await api.get(`/progress/me/assigned-courses/${courseId}/lesson-progress`);
    setProgressData(res.data);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        await Promise.all([loadCourseContent(), loadProgress()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [courseId]);

  // Reset answers when switching lessons
  useEffect(() => {
    setResponses({});
    setQuizResult(null);
  }, [lessonId]);

  const allLessons = courseData?.lessons || [];
  const currentLesson = allLessons.find((l) => l._id === lessonId);
  const progressPercent = progressData?.progressPercent || 0;
  const completedIds = useMemo(
    () => new Set((progressData?.lessons || []).filter((l) => l.status === "completed").map((l) => l.lessonId)),
    [progressData]
  );

  const currentIndex = allLessons.findIndex((l) => l._id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const goNext = () => {
    if (nextLesson) navigate(`/dashboard/staff/course/${courseId}/lesson/${nextLesson._id}`);
    else navigate("/dashboard/my-dashboard");
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const res = await api.post(`/progress/lessons/${lessonId}/complete`);
      await loadProgress();
      (res.data?.newBadges || []).forEach((b) => toastr.success(`🏅 Badge earned: ${b.name}`));
      goNext();
    } catch (err) {
      toastr.error("Could not mark complete");
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async () => {
    const payload = {
      responses: (currentLesson.blocks || [])
        .filter((b) => b.category === "knowledge_check")
        .map((b) => ({ blockId: b._id, value: responses[b._id] ?? null })),
    };
    try {
      setCompleting(true);
      const res = await api.post(`/courses/${courseId}/lessons/${lessonId}/quiz/submit`, payload);
      setQuizResult(res.data.attempt);
      await loadProgress();
      if (res.data.attempt.passed) toastr.success(`Passed with ${res.data.attempt.scorePercent}%`);
      else toastr.warning(`Score ${res.data.attempt.scorePercent}% — did not pass`);
      (res.data?.newBadges || []).forEach((b) => toastr.success(`🏅 Badge earned: ${b.name}`));
    } catch (err) {
      toastr.error(err.response?.data?.message || "Submit failed");
    } finally {
      setCompleting(false);
    }
  };

  const setAnswer = (blockId, value) => setResponses((prev) => ({ ...prev, [blockId]: value }));

  const uploadAnswerFile = async (blockId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(`/uploads/lessons/file/document`, formData);
      setAnswer(blockId, { storageKey: res.data.storageKey, contentUrl: res.data.publicUrl, fileName: res.data.fileName });
      toastr.success("Uploaded");
    } catch {
      toastr.error("Upload failed");
    }
  };

  function renderBlock(block) {
    const { kind, config } = block;
    const value = responses[block._id];
    switch (kind) {
      case "text":
        return <div className="lesson-content" dangerouslySetInnerHTML={{ __html: config.html || "" }} />;
      case "callout":
        return (
          <div className="rounded-lg border-l-4 border-emerald bg-emerald-muted/40 p-4 lesson-content" dangerouslySetInnerHTML={{ __html: config.html || "" }} />
        );
      case "divider":
        return (
          <hr
            className="border-0 border-t border-brand-border my-1"
            style={{
              borderTopWidth: `${config.thickness || 2}px`,
              borderTopStyle: config.style || "solid",
            }}
          />
        );
      case "accordion":
        return <Accordion config={config} />;
      case "flip_card":
        return <FlipCard config={config} />;
      case "image":
        return <FilePreview src={fileUrl(config)} mimeType={config.mimeType} fileName={config.fileName} height={320} />;
      case "attach_file":
        return <FilePreview src={fileUrl(config)} mimeType={config.mimeType || "application/pdf"} fileName={config.fileName} height={500} />;
      case "video_link":
        return (
          <div className="rounded-xl border border-brand-border bg-black overflow-hidden">
            <iframe className="block w-full" height="450" src={youtubeEmbed(config.contentUrl)} title="Lesson Video" allowFullScreen />
          </div>
        );
      case "text_answer":
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
            <textarea className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald" rows={3} value={value || ""} onChange={(e) => setAnswer(block._id, e.target.value)} />
          </div>
        );
      case "mcq":
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
            {(config.options || []).map((o) => {
              const selected = Array.isArray(value) ? value : [];
              const checked = selected.includes(o.key);
              const toggle = () => {
                if (config.multiple) {
                  setAnswer(block._id, checked ? selected.filter((k) => k !== o.key) : [...selected, o.key]);
                } else {
                  setAnswer(block._id, [o.key]);
                }
              };
              return (
                <label key={o.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border cursor-pointer hover:bg-canvas">
                  <input type={config.multiple ? "checkbox" : "radio"} name={`q-${block._id}`} className="accent-emerald" checked={checked} onChange={toggle} />
                  <span className="text-sm text-brand-text">{o.text}</span>
                </label>
              );
            })}
          </div>
        );
      case "survey":
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
            <NumberScale value={value || 0} scaleMax={config.scaleMax || 5} onChange={(v) => setAnswer(block._id, v)} />
          </div>
        );
      case "matching":
        return (
          <MatchingField config={config} value={value} onChange={(v) => setAnswer(block._id, v)} />
        );
      case "file_upload":
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-text">{config.prompt}</p>
            <input type="file" className="text-xs text-brand-muted" onChange={(e) => uploadAnswerFile(block._id, e.target.files[0])} />
            {value?.fileName && <p className="text-xs text-emerald">{value.fileName}</p>}
          </div>
        );
      case "esignature":
        return <SignaturePad label={config.label || "Sign below"} value={value} onChange={(v) => setAnswer(block._id, v)} />;
      default:
        return null;
    }
  }

  if (loading) return <PageLoader />;
  if (!currentLesson) return <p className="text-brand-muted text-body p-6">Lesson not found.</p>;

  const isQuiz = currentLesson.option === "quiz";
  const alreadyPassed = completedIds.has(currentLesson._id) && isQuiz;

  return (
    <div className="space-y-5">
      {/* Sticky progress bar */}
      <div className="sticky top-14 z-30 -mx-6 px-6 py-3 bg-canvas/95 backdrop-blur border-b border-brand-border">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="min-w-0">
            <p className="text-caption text-brand-muted uppercase tracking-wide">Course Progress</p>
            <p className="text-body font-semibold text-brand-text truncate">
              Lesson {currentIndex + 1} of {allLessons.length}
            </p>
          </div>
          <Badge tone={progressPercent === 100 ? "success" : "info"} size="lg">{progressPercent}%</Badge>
        </div>
        <ProgressBar percent={progressPercent} size="sm" />
      </div>

      <Card padded>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-heading text-brand-text">{currentLesson.title}</h1>
          <Badge tone="info" size="sm">{currentLesson.option}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allLessons.map((lesson, index) => {
            const isActive = lesson._id === lessonId;
            const isCompleted = completedIds.has(lesson._id);
            return (
              <motion.button
                key={lesson._id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`text-left p-3 rounded-xl border transition-colors relative ${
                  isActive
                    ? "border-emerald bg-emerald-muted shadow-soft"
                    : isCompleted
                    ? "border-emerald/30 bg-emerald-muted/60"
                    : "border-brand-border hover:border-emerald/40 bg-surface"
                }`}
                onClick={() => navigate(`/dashboard/staff/course/${courseId}/lesson/${lesson._id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-brand-muted uppercase">Lesson {index + 1}</span>
                  {isCompleted && <i className="fa-solid fa-circle-check text-emerald text-xs"></i>}
                </div>
                <p className="text-caption font-medium text-brand-text line-clamp-2">{lesson.title}</p>
              </motion.button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={lessonId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <ThemeScope theme={currentLesson.theme}>
            <Card padded className="!p-6">
              <div className="space-y-4">
                {(currentLesson.blocks || []).map((block) => (
                  <div key={block._id}>{renderBlock(block)}</div>
                ))}
              </div>

              {quizResult && (
                <div className={`mt-5 rounded-lg p-4 ${quizResult.passed ? "bg-emerald-muted/60 text-emerald" : "bg-amber-100 text-amber-700"}`}>
                  <p className="font-semibold">
                    {quizResult.passed ? "Passed" : "Not passed"} — {quizResult.scorePercent}% (attempt #{quizResult.attemptNo})
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-5 mt-2 border-t border-brand-border">
                <Button
                  variant="ghost"
                  disabled={!prevLesson}
                  leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
                  onClick={() => prevLesson && navigate(`/dashboard/staff/course/${courseId}/lesson/${prevLesson._id}`)}
                >
                  Previous
                </Button>

                {isQuiz ? (
                  quizResult?.passed || alreadyPassed ? (
                    <Button variant="primary" trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />} onClick={goNext}>
                      {nextLesson ? "Next Lesson" : "Finish"}
                    </Button>
                  ) : (
                    <Button variant="primary" loading={completing} trailingIcon={<i className="fa-solid fa-paper-plane text-xs" />} onClick={handleQuizSubmit}>
                      Submit Quiz
                    </Button>
                  )
                ) : (
                  <Button variant="primary" loading={completing} trailingIcon={<i className="fa-solid fa-check text-xs" />} onClick={handleComplete}>
                    {nextLesson ? "Complete & Next" : "Complete Lesson"}
                  </Button>
                )}
              </div>
            </Card>
          </ThemeScope>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
