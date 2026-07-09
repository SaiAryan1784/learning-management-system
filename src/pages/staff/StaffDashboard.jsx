import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { motion } from "framer-motion";
import api from "../../api/api";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  SkeletonCard,
  ProgressBar,
} from "../../components/ui";
import RingStatCard from "../../components/dashboard/RingStatCard";

const RING_COLORS = ["#9B2C4E", "#D69A1F", "#1AA179", "#13525B"];

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
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resumingId, setResumingId] = useState(null);
  const [loggedInToday, setLoggedInToday] = useState(null);
  const [totalOrgCourses, setTotalOrgCourses] = useState(null);

  const lastFetchRef = useRef(0);

  const roleName = user?.role?.name?.trim().toLowerCase();
  const isAdminUser = roleName === "owner" || roleName === "admin";

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const calls = [api.get("/progress/me/dashboard")];
      if (isAdminUser) calls.push(api.get("/progress/org/overview").catch(() => null));
      const [res, orgRes] = await Promise.all(calls);
      lastFetchRef.current = Date.now();
      setSummary(res.data.summary);
      setCourses(res.data.courses);
      if (orgRes) {
        setLoggedInToday(orgRes.data?.summary?.usersLoggedInToday ?? null);
        setTotalOrgCourses(orgRes.data?.summary?.totalCourses ?? null);
      }
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAdminUser]);

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
      <PageHeader title="My Dashboard" subtitle="Track your learning progress and achievements" />

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
              { icon: "fa-book", label: "Total Courses", value: isAdminUser ? (totalOrgCourses ?? summary.totalAssignedCourses) : summary.totalAssignedCourses },
              { icon: "fa-circle-check", label: "Completed", value: summary.completedCourses },
              { icon: "fa-spinner", label: "In Progress", value: summary.inProgressCourses },
              isAdminUser
                ? { icon: "fa-circle-dot", label: "Logged In Today", value: loggedInToday ?? "—" }
                : { icon: "fa-circle-pause", label: "Not Started", value: summary.notStartedCourses },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <RingStatCard label={s.label} value={s.value} color={RING_COLORS[i]} />
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
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ) : (() => {
        const roleName = user?.role?.name?.trim().toLowerCase();
        const isAdmin = roleName === "owner" || roleName === "admin";
        return (
          <Card padded={false}>
            <EmptyState
              icon={<i className="fa-solid fa-book-open" />}
              title="No courses assigned to you"
              description={
                isAdmin
                  ? "You have published courses — use the Assign button on any course to assign it to yourself or staff."
                  : "Once your admin assigns courses, they will show up here so you can start learning."
              }
              action={
                isAdmin ? (
                  <Button variant="primary" size="sm" onClick={() => navigate("/dashboard/courses")}>
                    Go to Courses
                    <i className="fa-solid fa-arrow-right ml-1.5 text-xs" />
                  </Button>
                ) : null
              }
            />
          </Card>
        );
      })()}
    </div>
  );
}
