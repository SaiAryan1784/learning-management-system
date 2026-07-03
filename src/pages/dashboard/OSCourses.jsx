import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { SectionLoader } from "../../components/ui/Spinner";
import { getCourseColor } from "../../utils/courseColor";
import { useAuth } from "../../auth/AuthContext";

export default function OSCourses() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/courses", { params: { status: "published", t: Date.now() } });
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Error loading courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/courses/${course._id}`);
      toastr.success("Course deleted");
      loadCourses();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Courses" subtitle="Published courses visible to staff">
        <Link
          to="/dashboard/courses/drafts"
          className="flex items-center gap-2 bg-charcoal-light hover:bg-charcoal-muted text-white/80 text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-pen-ruler text-xs"></i>
          Drafts
        </Link>
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={() => navigate("/dashboard/course-add")}
        >
          New Course
        </Button>
      </PageHeader>

      {loading ? (
        <SectionLoader />
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-brand-border rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mb-4">
            <i className="fa-solid fa-book-open text-emerald text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-brand-text mb-1">No published courses yet</h3>
          <p className="text-sm text-brand-muted mb-6 max-w-xs">
            Build a course in <Link to="/dashboard/courses/drafts" className="text-emerald font-semibold">Drafts</Link> and publish it to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const color = getCourseColor(course.title);
            return (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-surface border border-brand-border rounded-xl overflow-hidden hover:shadow-elevated transition-shadow duration-200"
              >
                <div className="h-2 w-full" style={{ backgroundColor: color }} />
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {course.title?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2">{course.title}</p>
                      <p className="text-[11px] text-brand-muted mt-1">{course.lessonCount ?? 0} lessons</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-brand-border">
                    <Button
                      variant="outline"
                      size="sm"
                      leadingIcon={<i className="fa-solid fa-folder-open text-[10px]" />}
                      onClick={() => navigate(`/dashboard/courses/${course._id}/lessons`)}
                    >
                      Lessons
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={<i className="fa-solid fa-pen text-[10px]" />}
                      onClick={() => navigate(`/dashboard/course-add/${course._id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={<i className="fa-solid fa-user-plus text-[10px]" />}
                      onClick={() => navigate(`/dashboard/courses/${course._id}/assign`)}
                    >
                      Assign
                    </Button>
                    {hasPermission("courses:delete") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        leadingIcon={<i className="fa-solid fa-trash text-[10px]" />}
                        onClick={() => handleDelete(course)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
