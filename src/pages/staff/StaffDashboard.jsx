import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import {
  PageHeader,
  StatCard,
  Card,
  Button,
  Badge,
  EmptyState,
  SkeletonCard,
  ProgressBar,
} from "../../components/ui";

function ProgressRing({ percent = 0, size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#10B981"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resumingId, setResumingId] = useState(null);

  const lastFetchRef = useRef(0);

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/progress/me/dashboard");
      lastFetchRef.current = Date.now();
      setSummary(res.data.summary);
      setCourses(res.data.courses);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFetchRef.current > 60_000) {
        fetchDashboard({ silent: true });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchDashboard]);

  const handleStartOrResume = async (course) => {
    try {
      if (!course?.courseId || course.totalLessons === 0) return;
      setResumingId(course.courseId);
      const res = await api.get(`/progress/courses/${course.courseId}/resume`);
      const lessonId = res.data?.resumeLesson?._id;
      if (!lessonId) return;
      navigate(`/dashboard/staff/course/${course.courseId}/lesson/${lessonId}`);
    } catch (err) {
      console.error("Resume failed", err);
    } finally {
      setResumingId(null);
    }
  };

  const getButtonText = (course) => {
    if (course.totalLessons === 0) return "No Lessons";
    if (course.progressPercent === 100) return "Review";
    if (course.progressPercent > 0) return "Resume";
    return "Start";
  };

  const getStatus = (course) => {
    if (course.totalLessons === 0) return { tone: "neutral", label: "Empty" };
    if (course.progressPercent === 100) return { tone: "success", label: "Completed" };
    if (course.progressPercent > 0) return { tone: "info", label: "In Progress" };
    return { tone: "warning", label: "Not Started" };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Dashboard" subtitle="Track your learning progress and achievements">
        {summary && (
          <div className="text-right">
            <div className="text-5xl font-black text-white tabular-nums leading-none">
              {summary.completedCourses || 0}
            </div>
            <div className="text-xs font-semibold text-emerald uppercase tracking-widest mt-1">
              courses completed
            </div>
          </div>
        )}
      </PageHeader>

      {loading && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        summary && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: "fa-book", label: "Total Courses", value: summary.totalAssignedCourses },
              { icon: "fa-circle-check", label: "Completed", value: summary.completedCourses },
              { icon: "fa-spinner", label: "In Progress", value: summary.inProgressCourses },
              { icon: "fa-circle-pause", label: "Not Started", value: summary.notStartedCourses },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <StatCard icon={s.icon} label={s.label} value={s.value} />
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      {loading && courses.length === 0 ? (
        <div>
          <h2 className="text-subheading text-brand-text mb-4">Your Assigned Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : courses.length > 0 ? (
        <div>
          <h2 className="text-subheading text-brand-text mb-4">Your Assigned Courses</h2>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {courses.map((course) => {
              const status = getStatus(course);
              return (
                <motion.div
                  key={course.courseId}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="flex flex-col h-full" padded>
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-body font-semibold text-brand-text leading-snug line-clamp-2 flex-1">
                        {course.title}
                      </p>
                      <Badge tone={status.tone} dot size="sm" className="flex-shrink-0">
                        {status.label}
                      </Badge>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-caption text-brand-muted mb-3 flex-wrap">
                      <span>
                        <i className="fa-solid fa-book-open mr-1" />
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                      {course.dueDate && (
                        <span className={course.overdue ? "text-brand-danger font-medium" : ""}>
                          <i className="fa-regular fa-calendar mr-1" />
                          Due {new Date(course.dueDate).toLocaleDateString()}
                          {course.overdue && " · Overdue"}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <ProgressBar
                        percent={course.progressPercent}
                        size="sm"
                        showLabel
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        loading={resumingId === course.courseId}
                        disabled={course.totalLessons === 0}
                        onClick={() => handleStartOrResume(course)}
                      >
                        <i className="fa-solid fa-play mr-1.5 text-[10px]" />
                        {getButtonText(course)}
                      </Button>
                      {course.progressPercent === 100 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() =>
                            navigate(`/dashboard/staff/course/${course.courseId}/assessments`)
                          }
                        >
                          Assessments
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState
            icon={<i className="fa-solid fa-book-open" />}
            title="No courses assigned yet"
            description="Once your admin assigns courses, they will show up here so you can start learning."
          />
        </Card>
      )}
    </div>
  );
}
