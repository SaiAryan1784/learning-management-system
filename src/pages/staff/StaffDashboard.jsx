import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/progress/me/dashboard", {
        params: { t: Date.now() },
      });
      setSummary(res.data.summary);
      setCourses(res.data.courses);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const handleFocus = () => fetchDashboard();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchDashboard]);

  const handleStartOrResume = async (course) => {
    try {
      if (!course?.courseId || course.totalLessons === 0) return;
      const res = await api.get(`/progress/courses/${course.courseId}/resume`, {
        params: { t: Date.now() },
      });
      const lessonId = res.data?.resumeLesson?._id;
      if (!lessonId) return;
      navigate(`/dashboard/staff/course/${course.courseId}/lesson/${lessonId}`);
    } catch (err) {
      console.error("Resume failed", err);
    }
  };

  const getButtonText = (course) => {
    if (course.totalLessons === 0) return "No Lessons";
    if (course.progressPercent === 100) return "Review";
    if (course.progressPercent > 0) return "Resume";
    return "Start";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-brand-muted text-sm">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="My Dashboard" subtitle="Track your learning progress and achievements">
        {summary && (
          <span className="text-3xl font-bold text-white">
            {summary.completedCourses || 0}
            <span className="text-sm font-normal text-white/60 ml-1">completed</span>
          </span>
        )}
      </PageHeader>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="fa-book" label="Total Courses" value={summary.totalAssignedCourses} />
          <StatCard icon="fa-circle-check" label="Completed" value={summary.completedCourses} />
          <StatCard icon="fa-spinner" label="In Progress" value={summary.inProgressCourses} />
          <StatCard icon="fa-circle-pause" label="Not Started" value={summary.notStartedCourses} />
        </div>
      )}

      {/* Course Cards */}
      {courses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-brand-text mb-4">Your Assigned Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.courseId}
                className="bg-surface border border-brand-border rounded-xl p-4 flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-brand-text leading-tight pr-2">
                    {course.title}
                  </span>
                  <span className="text-sm font-bold text-emerald flex-shrink-0">
                    {course.progressPercent}%
                  </span>
                </div>

                <div className="h-1.5 bg-brand-border rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald rounded-full transition-all duration-500"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-brand-muted mb-3">
                  {course.completedLessons}/{course.totalLessons} Lessons
                  {course.dueDate && (
                    <> • Due: {new Date(course.dueDate).toLocaleDateString()}</>
                  )}
                </p>

                <div className="flex gap-2 mt-auto">
                  <button
                    className="flex-1 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={course.totalLessons === 0}
                    onClick={() => handleStartOrResume(course)}
                  >
                    {getButtonText(course)}
                  </button>
                  {course.progressPercent === 100 && (
                    <button
                      className="flex-1 bg-charcoal hover:bg-charcoal-light text-white text-xs font-semibold uppercase tracking-wide py-2 rounded-lg transition-colors"
                      onClick={() =>
                        navigate(`/dashboard/staff/course/${course.courseId}/assessments`)
                      }
                    >
                      Assessments
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-book-open text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No courses assigned yet.</p>
        </div>
      )}
    </div>
  );
}
