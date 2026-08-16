import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { SectionLoader } from "../../components/ui/Spinner";
import { useAuth } from "../../auth/AuthContext";
import CourseCover from "../../components/dashboard/CourseCover";

// Archived courses live behind this page rather than getting a route of their
// own: they are the retired end of the same "not published" pile the drafts
// list already shows, and they are looked at rarely.
const TABS = [
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

export default function CourseDrafts() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [tab, setTab] = useState("draft");

  const loadCourses = async (status = tab) => {
    try {
      setLoading(true);
      const res = await api.get("/courses", { params: { status, t: Date.now() } });
      setCourses(res.data.courses || []);
    } catch {
      toastr.error(status === "archived" ? "Error loading archived courses" : "Error loading drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const publish = async (id) => {
    try {
      setPublishingId(id);
      await api.patch(`/courses/${id}/publish`);
      toastr.success("Course published");
      loadCourses();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/courses/${course._id}`);
      toastr.success("Course deleted");
      loadCourses();
    } catch (err) {
      toastr.error(err.response?.data?.error || err.response?.data?.message || "Delete failed");
    }
  };

  const setArchived = async (course, archived) => {
    const message = archived
      ? `Archive "${course.title}"? It leaves your lists and staff stop seeing it, but nothing is deleted — you can restore it from the Archived tab.`
      : `Restore "${course.title}"? It comes back as a draft, so publish it again when you're ready.`;
    if (!window.confirm(message)) return;

    try {
      await api.patch(`/courses/${course._id}/archive`, { archived });
      toastr.success(archived ? "Course archived" : "Course restored as a draft");
      loadCourses();
    } catch (err) {
      toastr.error(
        err.response?.data?.error || err.response?.data?.message ||
          (archived ? "Archive failed" : "Restore failed"),
      );
    }
  };

  const isArchivedTab = tab === "archived";

  return (
    <div className="space-y-5">
      <PageHeader
        title={isArchivedTab ? "Archived Courses" : "Draft Courses"}
        subtitle={
          isArchivedTab
            ? "Retired courses — kept for your records, hidden from staff"
            : "Courses still in progress — not visible to staff"
        }
      >
        <Link
          to="/dashboard/courses"
          className="flex items-center gap-2 bg-charcoal-light hover:bg-charcoal-muted text-white/80 text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
          Published
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

      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-canvas border border-brand-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              tab === t.key
                ? "bg-surface text-brand-text shadow-soft"
                : "text-brand-muted hover:text-brand-text",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoader />
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-brand-border rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mb-4">
            <i className={`fa-solid ${isArchivedTab ? "fa-box-archive" : "fa-pen-ruler"} text-icon text-2xl`} />
          </div>
          <h3 className="text-lg font-semibold text-brand-text mb-1">
            {isArchivedTab ? "Nothing archived" : "No drafts yet"}
          </h3>
          <p className="text-sm text-brand-muted mb-6 max-w-xs">
            {isArchivedTab
              ? "Courses you archive are kept here so you can restore them later."
              : "Create your first course to get started."}
          </p>
          {!isArchivedTab && (
            <Button
              variant="primary"
              size="md"
              leadingIcon={<i className="fa-solid fa-plus" />}
              onClick={() => navigate("/dashboard/course-add")}
            >
              Create your first course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-surface border border-brand-border rounded-xl overflow-hidden hover:shadow-elevated transition-shadow duration-200"
            >
              <CourseCover title={course.title} coverImageUrl={course.coverImageUrl} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2">{course.title}</p>
                    <p className="text-[11px] text-brand-muted mt-1">{course.lessonCount ?? 0} lessons</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-muted/10 text-brand-muted">
                    {isArchivedTab ? "archived" : "draft"}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-brand-border">
                  {isArchivedTab ? (
                    <Button
                      variant="outline"
                      size="sm"
                      leadingIcon={<i className="fa-solid fa-rotate-left text-[10px]" />}
                      onClick={() => setArchived(course, false)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <>
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
                        variant="primary"
                        size="sm"
                        loading={publishingId === course._id}
                        leadingIcon={<i className="fa-solid fa-rocket text-[10px]" />}
                        onClick={() => publish(course._id)}
                      >
                        Publish
                      </Button>
                    </>
                  )}

                  {hasPermission("courses:delete") && (
                    <>
                      {!isArchivedTab && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={<i className="fa-solid fa-box-archive text-[10px]" />}
                          onClick={() => setArchived(course, true)}
                          title="Retire this course without deleting anything"
                        >
                          Archive
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        leadingIcon={<i className="fa-solid fa-trash text-[10px]" />}
                        onClick={() => handleDelete(course)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
