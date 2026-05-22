import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";

export default function ManagerStaffDetails() {
  const { staffId } = useParams();

  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState({});

  useEffect(() => { loadProgress(); }, [staffId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/progress/staff/${staffId}`);
      setStaffData(res.data);
    } catch {
      toastr.error("Failed to load staff progress");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) =>
    setExpandedCourses((prev) => ({ ...prev, [id]: !prev[id] }));

  const calculateCountdown = (dueDate) => {
    if (!dueDate) return "No Due Date";
    const diff = new Date(dueDate) - new Date();
    if (diff <= 0) return "Overdue";
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))} Days Remaining`;
  };

  if (loading) return <p className="text-brand-muted text-sm p-6">Loading...</p>;
  if (!staffData) return <p className="text-brand-muted text-sm p-6">No data found.</p>;

  const { staff, courseProgress = [], lessonProgress = [] } = staffData;

  const overallPercent =
    courseProgress.length === 0
      ? 0
      : Math.round(courseProgress.reduce((s, c) => s + (c.progressPercent || 0), 0) / courseProgress.length);

  const completedCourses = courseProgress.filter((c) => c.progressPercent === 100).length;
  const overdueCourses = courseProgress.filter((c) => c.overdue).length;

  return (
    <div className="space-y-5">
      <PageHeader title={staff?.name || "Staff Details"} subtitle={staff?.email}>
        <div className="flex items-center gap-2 bg-emerald/10 border border-emerald/20 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-emerald">{overallPercent}%</span>
          <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide">Overall</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="fa-book-open" label="Total Courses" value={courseProgress.length} />
        <StatCard icon="fa-circle-check" label="Completed" value={completedCourses} />
        <StatCard icon="fa-triangle-exclamation" label="Overdue" value={overdueCourses} danger={overdueCourses > 0} />
        <StatCard icon="fa-chart-line" label="Completion" value={`${overallPercent}%`} />
      </div>

      <div className="bg-surface border border-brand-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-brand-text uppercase tracking-wide mb-4">Course Progress</h2>
        <div className="space-y-4">
          {courseProgress.map((course) => {
            const percent = course.progressPercent || 0;
            return (
              <div key={course._id} className="border border-brand-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-brand-text">{course.course?.title}</span>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {course.completedLessons} / {course.totalLessons} Lessons &bull;{" "}
                      <span className={course.overdue ? "text-brand-danger font-semibold" : ""}>
                        {calculateCountdown(course.dueDate)}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald">{percent}%</span>
                </div>
                <div className="h-1.5 bg-brand-border rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-emerald rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <button
                  className="text-xs font-semibold text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-emerald hover:text-emerald transition-colors"
                  onClick={() => toggleExpand(course._id)}
                >
                  {expandedCourses[course._id] ? "Hide Lessons" : "View Lessons"}
                </button>

                {expandedCourses[course._id] && (
                  <div className="mt-3 border-t border-brand-border pt-3 space-y-1">
                    {lessonProgress
                      .filter((l) => l.course === course.course._id)
                      .map((lesson) => (
                        <div key={lesson._id} className="flex items-center justify-between text-xs py-1">
                          <span className="text-brand-text">{lesson.lesson?.title}</span>
                          <span className={lesson.status === "completed" ? "text-emerald font-semibold" : "text-brand-muted"}>
                            {lesson.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
          {courseProgress.length === 0 && (
            <p className="text-brand-muted text-sm text-center py-8">No courses assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
}
