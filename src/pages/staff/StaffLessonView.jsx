import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { PageLoader } from "../../components/ui/Spinner";
import { Button, Badge, Card, ProgressBar } from "../../components/ui";
import { ThemeScope, useBrand } from "../../contexts/BrandContext";
import FilePreview, { allowsDownload } from "../../components/lesson/FilePreview";
import VideoEmbed from "../../components/lesson/VideoEmbed";
import NumberScale from "../../components/lesson/NumberScale";
import SignaturePad from "../../components/lesson/SignaturePad";
import FlipCard from "../../components/lesson/FlipCard";
import "../../components/lesson/lessonContent.css";
import { onFilePick } from "../../utils/fileInput";

const BASE_URL = api.defaults.baseURL || "";
// VITE_FILE_BASE_URL is set explicitly in .env.production so uploads always resolve
// to the real server — not localhost — regardless of how the build was run.
const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL || BASE_URL.replace(/\/api$/, "");

// "guide" is the lesson TYPE (material + questions). It is not the Guide
// container — that word belongs to the multi-page grouping now.
const OPTION_LABEL = {
  resource: "Resource",
  guide: "Material + questions",
  quiz: "Quiz",
};

const fileUrl = (config) => {
  if (!config) return "";
  if (config.contentUrl) return config.contentUrl.startsWith("http") ? config.contentUrl : `${FILE_BASE_URL}${config.contentUrl}`;
  if (config.storageKey) return `${FILE_BASE_URL}/uploads/${config.storageKey}`;
  return "";
};

/* ── curriculum navigation ── */

/**
 * Link to a lesson, carrying which guide it was opened from.
 *
 * The same lesson can be referenced by several guides, and the route only
 * carries a lesson id — so `?guide=` is what makes "Page 2 of 5 in THIS guide"
 * and guide-scoped Next/Previous resolve to the guide the learner is actually
 * reading. Without it we'd have to guess (the backend's `flatLessons[].pathId`
 * is the FIRST occurrence, which is a coin flip for a shared lesson).
 */
function lessonHref(courseId, lessonId, guideId) {
  const base = `/dashboard/staff/course/${courseId}/lesson/${lessonId}`;
  return guideId ? `${base}?guide=${guideId}` : base;
}

/**
 * Where the learner is, and where Previous/Next go — derived from one payload.
 *
 * Kept a pure function of the content response rather than component state so
 * that "Complete & Next" can re-resolve against FRESHLY fetched content. It
 * skips locked pages, and completing a lesson is exactly what unlocks the next
 * one, so resolving against the pre-completion payload jumped the learner over
 * the page they had just earned.
 */
function resolveNavigation(courseData, lessonId, requestedGuideId) {
  const allLessons = courseData?.lessons || [];
  const items = courseData?.items || allLessons.map((l) => ({ kind: "lesson", ...l }));

  const guidesForCurrent = items
    .filter((it) => it.kind === "path")
    .filter((g) => (g.lessons || []).some((l) => l._id === lessonId));

  const currentGuide =
    guidesForCurrent.find((g) => String(g._id) === String(requestedGuideId)) ||
    guidesForCurrent[0] ||
    null;

  const guidePages = currentGuide?.lessons || [];
  const pageIndex = currentGuide ? guidePages.findIndex((l) => l._id === lessonId) : -1;
  const currentIndex = allLessons.findIndex((l) => l._id === lessonId);

  // Inside a guide, Previous/Next walk that guide's pages and stop at its edges
  // — a guide is one topic, so falling out of it mid-flow reads as a bug.
  // A top-level lesson keeps walking the whole course.
  let prevLesson = null;
  let nextLesson = null;
  if (currentGuide && pageIndex >= 0) {
    prevLesson = pageIndex > 0 ? guidePages[pageIndex - 1] : null;
    nextLesson = guidePages.slice(pageIndex + 1).find((l) => !l.locked) || null;
  } else {
    prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    // Skip lessons still locked behind an incomplete prerequisite.
    nextLesson =
      currentIndex >= 0
        ? allLessons.slice(currentIndex + 1).find((l) => !l.locked) || null
        : null;
  }

  return { allLessons, items, currentGuide, guidePages, pageIndex, currentIndex, prevLesson, nextLesson };
}

function LessonTile({ lesson, currentLessonId, completedIds, courseId, guideId, navigate }) {
  const isActive = lesson._id === currentLessonId;
  const isCompleted = completedIds.has(lesson._id);
  const isLocked = lesson.locked === true;
  const isPage = Boolean(guideId);

  let toneClass = "border-brand-border hover:border-emerald/40 bg-surface";
  if (isActive) toneClass = "border-emerald bg-emerald-muted shadow-soft";
  else if (isCompleted) toneClass = "border-emerald/30 bg-emerald-muted/60";
  else if (isLocked) toneClass = "border-brand-border bg-canvas opacity-60 cursor-not-allowed";

  return (
    <motion.button
      whileHover={isLocked ? undefined : { y: -2 }}
      whileTap={isLocked ? undefined : { scale: 0.98 }}
      disabled={isLocked}
      title={isLocked ? "Finish the earlier pages in this guide first" : undefined}
      className={`text-left p-3 rounded-xl border transition-colors relative ${toneClass}`}
      onClick={() =>
        !isLocked && navigate(lessonHref(courseId, lesson._id, guideId))
      }
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-brand-muted uppercase">
          {isPage ? `Page ${lesson.pageNumber}` : `Lesson ${lesson.sequence}`}
        </span>
        {isCompleted && <i className="fa-solid fa-circle-check text-icon text-xs"></i>}
        {!isCompleted && isLocked && (
          <i className="fa-solid fa-lock text-brand-muted text-xs"></i>
        )}
      </div>
      <p className="text-caption font-medium text-brand-text line-clamp-2">{lesson.title}</p>
      {lesson.required === false && (
        <span className="text-[10px] text-brand-muted">Optional</span>
      )}
    </motion.button>
  );
}

/** A guide — one topic, several ordered pages — rendered as one collapsible unit. */
function PathGroup({ path, currentLessonId, completedIds, courseId, navigate }) {
  const lessons = path.lessons || [];
  const holdsCurrent = lessons.some((l) => l._id === currentLessonId);
  // Open the group the learner is actually in; keep the rest collapsed.
  const [open, setOpen] = useState(holdsCurrent);
  const doneCount = lessons.filter((l) => completedIds.has(l._id)).length;
  const percent = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;

  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full px-4 py-3 bg-canvas text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0">
            <i className="fa-solid fa-folder-tree text-icon text-xs"></i>
            <span className="text-sm font-semibold text-brand-text truncate">{path.title}</span>
            {path.sequentialUnlock && (
              <i
                className="fa-solid fa-lock text-brand-muted text-[10px]"
                title="Pages unlock in order"
              ></i>
            )}
          </span>
          <span className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[11px] text-brand-muted">
              {doneCount} of {lessons.length} pages complete
            </span>
            <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-xs text-brand-muted`}></i>
          </span>
        </span>
        <span className="block mt-2">
          <ProgressBar percent={percent} size="xs" />
        </span>
      </button>

      {open && (
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {lessons.map((lesson, i) => (
            <LessonTile
              key={lesson.occurrenceKey || lesson._id}
              lesson={{ ...lesson, pageNumber: i + 1 }}
              currentLessonId={currentLessonId}
              completedIds={completedIds}
              courseId={courseId}
              guideId={path._id}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // Prompt and answer stack on phones and sit side by side from `sm` up. The
  // `min-w-0` on both halves is what actually lets them shrink — without it a
  // flex child refuses to go below its content width and long answers get
  // clipped off the edge of the card instead of wrapping.
  return (
    <div className="space-y-2">
      {lefts.map((left) => {
        const current = (value || []).find((v) => v.left === left)?.right || "";
        return (
          <div key={left} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="min-w-0 sm:flex-1 px-3 py-2 rounded-lg bg-canvas border border-brand-border text-sm break-words">
              {left}
            </span>
            <i className="fa-solid fa-arrow-right text-brand-muted text-xs rotate-90 sm:rotate-0 self-center flex-shrink-0"></i>
            <select
              className="min-w-0 sm:flex-1 w-full px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
              value={current}
              onChange={(e) => setRightFor(left, e.target.value)}
            >
              <option value="">Select match…</option>
              {/* A native <select> truncates long option text with no way to
                  style around it — `title` at least makes the full answer
                  readable on hover. */}
              {rights.map((r) => (
                <option key={r} value={r} title={r}>{r}</option>
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
  const [searchParams] = useSearchParams();
  const requestedGuideId = searchParams.get("guide");
  const { lessonTheme } = useBrand();

  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [responses, setResponses] = useState({}); // blockId -> value
  const [quizResult, setQuizResult] = useState(null);
  // The outline is a jump-list, not the lesson. A real course here has 40+
  // lessons, so leaving it expanded buried the lesson itself thousands of
  // pixels down the page and learners reported "nothing loads".
  const [outlineOpen, setOutlineOpen] = useState(false);

  const rootRef = useRef(null);

  const loadCourseContent = async () => {
    const res = await api.get(`/progress/me/assigned-courses/${courseId}/content`);
    setCourseData(res.data);
    // Returned as well as stored: completing a lesson has to navigate from the
    // payload it just fetched, not from the state this render closed over.
    return res.data;
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

  // Next/Previous keep the learner mounted on the same route, so without this
  // they land on the new lesson still scrolled to wherever they finished the
  // last one. The dashboard scrolls <main>, not the window.
  useEffect(() => {
    rootRef.current?.closest("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessonId]);

  const nav = useMemo(
    () => resolveNavigation(courseData, lessonId, requestedGuideId),
    [courseData, lessonId, requestedGuideId]
  );
  const { allLessons, items, currentGuide, guidePages, pageIndex, currentIndex, prevLesson, nextLesson } = nav;

  const currentLesson = allLessons.find((l) => l._id === lessonId);
  const progressPercent = progressData?.progressPercent || 0;
  const completedIds = useMemo(
    () => new Set((progressData?.lessons || []).filter((l) => l.status === "completed").map((l) => l.lessonId)),
    [progressData]
  );

  // Collapse runs of top-level lessons into ONE responsive grid. Rendering a
  // grid per lesson put a single tile on every row, which is what turned a
  // 43-lesson course's outline into ~4,000px of scroll.
  const outlineRows = useMemo(() => {
    const rows = [];
    for (const item of items) {
      if (item.kind === "path") {
        rows.push({ kind: "path", item });
        continue;
      }
      const last = rows[rows.length - 1];
      if (last?.kind === "lessons") last.lessons.push(item);
      else rows.push({ kind: "lessons", lessons: [item] });
    }
    return rows;
  }, [items]);

  const goTo = (target, guide) => {
    if (target) {
      navigate(lessonHref(courseId, target._id, guide?._id));
    } else {
      navigate("/dashboard/my-dashboard");
    }
  };

  const goNext = () => goTo(nextLesson, currentGuide);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      // Tells the backend which course context this completion is happening
      // in, so the sequential-unlock check is exact rather than permissive
      // across every course that happens to reach this lesson.
      const res = await api.post(`/progress/lessons/${lessonId}/complete`, { courseId });
      // Refetch CONTENT as well as progress: this completion is what unlocks
      // the next page, and Next skips anything still flagged locked.
      const [fresh] = await Promise.all([loadCourseContent(), loadProgress()]);
      (res.data?.newBadges || []).forEach((b) => toastr.success(`🏅 Badge earned: ${b.name}`));
      const after = resolveNavigation(fresh, lessonId, requestedGuideId);
      goTo(after.nextLesson, after.currentGuide);
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
          <div
            className="my-1 w-full"
            style={{
              height: 0,
              borderTopWidth: `${config.thickness || 2}px`,
              borderTopStyle: config.style || "solid",
              borderTopColor: "#E5E7EB",
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
        return <FilePreview src={fileUrl(config)} mimeType={config.mimeType || "application/pdf"} fileName={config.fileName} height={500} allowDownload={allowsDownload(config)} />;
      case "video_link":
        return <VideoEmbed url={config.contentUrl} height={320} title="Lesson video" />;
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
            <input type="file" className="text-xs text-brand-muted" onChange={onFilePick((file) => uploadAnswerFile(block._id, file))} />
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

  // Reachable by pasting a URL — the backend refuses to record progress for a
  // locked lesson, so don't render its content either.
  if (currentLesson.locked) {
    return (
      <div className="p-10 text-center">
        <i className="fa-solid fa-lock text-brand-muted text-3xl mb-3 block"></i>
        <p className="text-brand-text text-body font-medium mb-1">
          This {currentGuide ? "page" : "lesson"} is locked
        </p>
        <p className="text-brand-muted text-caption mb-4">
          {currentGuide
            ? "Finish the earlier pages in this guide to unlock it."
            : "Finish the earlier lessons to unlock it."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard/my-dashboard")}>
          Back to my dashboard
        </Button>
      </div>
    );
  }

  const isQuiz = currentLesson.option === "quiz";
  const alreadyPassed = completedIds.has(currentLesson._id) && isQuiz;

  // A guide is one topic, so its last page ends the guide rather than silently
  // spilling the learner into the next one.
  const inGuide = Boolean(currentGuide);
  const advanceLabel = nextLesson
    ? inGuide ? "Next Page" : "Next Lesson"
    : inGuide ? "Finish Guide" : "Finish";
  const completeLabel = nextLesson
    ? "Complete & Next"
    : inGuide ? "Complete Guide" : "Complete Lesson";

  return (
    <div className="space-y-5" ref={rootRef}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 bg-surface/95 backdrop-blur border-b border-brand-border">
        <div className="flex items-center justify-between gap-4 px-6 py-2.5">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-brand-text truncate" title={currentLesson.title}>
              {currentLesson.title}
            </h1>
            {/* Inside a guide the learner's position is "which page of this
                topic", not "which lesson of the whole course". */}
            {currentGuide ? (
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs text-brand-muted truncate">
                  <span className="font-medium text-brand-text/70">{currentGuide.title}</span>
                  {" · "}Page {pageIndex + 1} of {guidePages.length}
                </p>
                <span className="flex items-center gap-1 flex-shrink-0">
                  {guidePages.map((p, i) => (
                    <span
                      key={p.occurrenceKey || p._id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i === pageIndex
                          ? "bg-emerald"
                          : completedIds.has(p._id)
                            ? "bg-emerald/40"
                            : "bg-brand-border"
                      }`}
                    />
                  ))}
                </span>
              </div>
            ) : (
              <p className="text-xs text-brand-muted">
                Lesson {currentIndex + 1} of {allLessons.length} &middot; {OPTION_LABEL[currentLesson.option] || currentLesson.option}
              </p>
            )}
          </div>
          <Badge tone={progressPercent === 100 ? "success" : "info"} size="sm">{progressPercent}%</Badge>
        </div>
        <ProgressBar percent={progressPercent} size="xs" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={lessonId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* The org-wide lesson palette, scoped to this container so it never
              reaches the surrounding app chrome. */}
          <ThemeScope theme={lessonTheme}>
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
                  onClick={() =>
                    prevLesson && navigate(lessonHref(courseId, prevLesson._id, currentGuide?._id))
                  }
                >
                  Previous
                </Button>

                {isQuiz ? (
                  quizResult?.passed || alreadyPassed ? (
                    <Button variant="primary" trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />} onClick={goNext}>
                      {advanceLabel}
                    </Button>
                  ) : (
                    <Button variant="primary" loading={completing} trailingIcon={<i className="fa-solid fa-paper-plane text-xs" />} onClick={handleQuizSubmit}>
                      Submit Quiz
                    </Button>
                  )
                ) : (
                  <Button variant="primary" loading={completing} trailingIcon={<i className="fa-solid fa-check text-xs" />} onClick={handleComplete}>
                    {completeLabel}
                  </Button>
                )}
              </div>
            </Card>
          </ThemeScope>
        </motion.div>
      </AnimatePresence>

      {/* The jump-list lives BELOW the lesson and starts closed. Above it and
          open, a large course pushed the lesson itself off the bottom of the
          screen and the page read as broken. */}
      <Card padded>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 text-left"
          onClick={() => setOutlineOpen((o) => !o)}
          aria-expanded={outlineOpen}
        >
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Course contents
            <span className="ml-2 normal-case font-medium text-brand-muted/80">
              {allLessons.length} lesson{allLessons.length === 1 ? "" : "s"}
            </span>
          </span>
          <i
            className={`fa-solid fa-chevron-${outlineOpen ? "up" : "down"} text-xs text-brand-muted`}
          ></i>
        </button>

        {outlineOpen && (
          <div className="space-y-4 mt-4">
            {outlineRows.map((row) =>
              row.kind === "path" ? (
                <PathGroup
                  key={row.item._id}
                  path={row.item}
                  currentLessonId={lessonId}
                  completedIds={completedIds}
                  courseId={courseId}
                  navigate={navigate}
                />
              ) : (
                <div
                  key={row.lessons[0].occurrenceKey || row.lessons[0]._id}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                >
                  {row.lessons.map((lesson) => (
                    <LessonTile
                      key={lesson.occurrenceKey || lesson._id}
                      lesson={lesson}
                      currentLessonId={lessonId}
                      completedIds={completedIds}
                      courseId={courseId}
                      navigate={navigate}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
