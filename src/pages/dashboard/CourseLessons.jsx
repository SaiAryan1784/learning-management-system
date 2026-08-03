import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import PathFormModal from "../../components/dashboard/PathFormModal";
import LessonPickerModal from "../../components/dashboard/LessonPickerModal";

const OPTION_META = {
  resource: { label: "Resource", icon: "fa-file-lines", tone: "bg-blue-100 text-blue-600" },
  guide: { label: "Guide", icon: "fa-book-open", tone: "bg-violet-100 text-violet-600" },
  quiz: { label: "Quiz", icon: "fa-clipboard-question", tone: "bg-amber-100 text-amber-600" },
};

// Kept separate from OPTION_META on purpose: that map is keyed by lesson.option,
// so folding "path" into it would invite a wrong-key lookup rendering a blank badge.
const PATH_META = {
  label: "Path",
  icon: "fa-folder-tree",
  tone: "bg-emerald/10 text-emerald",
};

export default function CourseLessons() {
  // pathId present = we're inside a path, showing the lessons IT REFERENCES
  // (which may be homed in any course) rather than the course's own lessons.
  const { courseId, pathId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pathMeta, setPathMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const [curriculumRes, courseRes] = await Promise.all([
        api.get(
          `/courses/${courseId}/curriculum${pathId ? `?pathId=${pathId}` : ""}`,
        ),
        api.get(`/courses/${courseId}`),
      ]);
      setItems(curriculumRes.data.items || []);
      setPathMeta(curriculumRes.data.path || null);
      const course = courseRes.data.course || courseRes.data;
      setPublished(course.status === "published" || course.published === true);
    } catch {
      toastr.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await api.patch(`/courses/${courseId}/publish`);
      toastr.success("Course published");
      navigate("/dashboard/courses");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [courseId, pathId]);

  const removeFromPath = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from this path? The lesson stays in its course.`)) {
      return;
    }
    try {
      await api.delete(`/courses/${courseId}/paths/${pathId}/lessons/${item._id}`);
      toastr.success("Removed from path");
      loadCurriculum();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to remove lesson");
    }
  };

  const deletePath = async (item) => {
    const msg =
      item.lessonCount > 0
        ? `Remove this path and its ${item.lessonCount} lesson reference${item.lessonCount === 1 ? "" : "s"}? The lessons stay in their courses.`
        : `Delete the empty path "${item.title}"?`;
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/courses/${courseId}/paths/${item._id}`);
      toastr.success("Path deleted");
      loadCurriculum();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Delete failed");
    }
  };

  // Deleting the lesson itself (not just a reference) is only ever offered at
  // its home course — doing it from inside a path would destroy another
  // course's content. A path referencing it that gets 409'd is asked to
  // confirm and retry with ?force=true, which prunes the reference instead.
  const deleteLesson = async (item) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await api.delete(`/courses/${courseId}/lessons/${item._id}`);
      toastr.success("Lesson deleted");
      loadCurriculum();
    } catch (err) {
      const message = err.response?.data?.error || "";
      if (err.response?.status === 409) {
        if (window.confirm(`${message}\n\nDelete anyway?`)) {
          try {
            await api.delete(`/courses/${courseId}/lessons/${item._id}?force=true`);
            toastr.success("Lesson deleted");
            loadCurriculum();
          } catch (err2) {
            toastr.error(err2.response?.data?.error || "Delete failed");
          }
        }
        return;
      }
      toastr.error(message || "Delete failed");
    }
  };

  const handleDelete = (item) => {
    if (item.kind === "path") return deletePath(item);
    if (pathId) return removeFromPath(item);
    return deleteLesson(item);
  };

  const toggleRequired = async (lesson) => {
    try {
      if (pathId) {
        await api.patch(`/courses/${courseId}/paths/${pathId}/lessons/${lesson._id}`, {
          required: !lesson.required,
        });
      } else {
        await api.put(`/courses/${courseId}/lessons/${lesson._id}`, {
          required: !lesson.required,
        });
      }
      loadCurriculum();
    } catch {
      toastr.error("Failed to update lesson");
    }
  };

  const openPath = (item) =>
    navigate(`/dashboard/courses/${courseId}/paths/${item._id}/lessons`);

  const newLessonPath = pathId
    ? `/dashboard/courses/${courseId}/paths/${pathId}/lessons/new`
    : `/dashboard/courses/${courseId}/lessons/new`;

  const backTo = pathId
    ? `/dashboard/courses/${courseId}/lessons`
    : "/dashboard/courses";

  const actionBtn =
    "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader
        title={pathId ? pathMeta?.title || "Path" : "Lessons"}
        subtitle={
          pathId
            ? "Lessons this path references — add existing ones or create new"
            : "A course is a folder of lessons and paths — add and order them here"
        }
      >
        {pathId ? (
          <>
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<i className="fa-solid fa-list-check text-xs" />}
              onClick={() => setPickerOpen(true)}
            >
              Add existing lessons
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<i className="fa-solid fa-plus text-xs" />}
              onClick={() => navigate(newLessonPath)}
            >
              Create new lesson
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<i className="fa-solid fa-plus text-xs" />}
              onClick={() => navigate(newLessonPath)}
            >
              Add Lesson
            </Button>
            {/* No nested paths in v1 — only offered at course level. */}
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<i className="fa-solid fa-folder-plus text-xs" />}
              onClick={() => {
                setEditingPath(null);
                setPathModalOpen(true);
              }}
            >
              Add Path
            </Button>
          </>
        )}

        {!pathId && !published && (
          <Button
            variant="secondary"
            size="sm"
            loading={publishing}
            leadingIcon={<i className="fa-solid fa-rocket text-xs" />}
            onClick={handlePublish}
          >
            Publish Course
          </Button>
        )}
        {!pathId && published && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald/10 text-emerald text-xs font-semibold">
            <i className="fa-solid fa-circle-check text-[10px]" />
            Published
          </span>
        )}
        <Link
          to={backTo}
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {loading ? (
        <SectionLoader />
      ) : items.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-folder-open text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">
            {pathId
              ? "No lessons in this path yet. Add existing ones or create a new one."
              : "Nothing here yet. Add a lesson, or a path to group lessons together."}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-brand-border rounded-xl divide-y divide-brand-border">
          {items.map((item) => {
            const isPath = item.kind === "path";
            const meta = isPath
              ? PATH_META
              : OPTION_META[item.option] || OPTION_META.resource;

            return (
              <div
                key={item._id}
                role={isPath ? "button" : undefined}
                tabIndex={isPath ? 0 : undefined}
                className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                  isPath ? "hover:bg-emerald/5 cursor-pointer" : "hover:bg-canvas"
                }`}
                onClick={isPath ? () => openPath(item) : undefined}
                onKeyDown={
                  isPath
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openPath(item);
                        }
                      }
                    : undefined
                }
              >
                {/* Path-referenced lessons (pathId view) carry no `order` — a
                    path's ordering is its array position, not a number. */}
                {item.order != null && (
                  <span className="w-7 h-7 flex items-center justify-center rounded-md bg-canvas border border-brand-border text-xs font-bold text-brand-muted flex-shrink-0">
                    {item.order}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}
                >
                  <i className={`fa-solid ${meta.icon} text-[10px]`}></i>
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {item.title}
                    {item.isForeign && item.homeCourse && (
                      <span className="ml-2 text-[10px] font-normal text-brand-muted">
                        from {item.homeCourse.title}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {isPath ? (
                      <>
                        {item.lessonCount} lesson{item.lessonCount === 1 ? "" : "s"}
                        {item.sequentialUnlock ? " · Unlocks in order" : ""}
                      </>
                    ) : (
                      <>
                        {item.blockCount ?? item.blocks?.length ?? 0} fields
                        {item.theme?.name ? ` · Theme: ${item.theme.name}` : ""}
                        {item.required === false ? " · Optional" : ""}
                      </>
                    )}
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isPath && (
                    <button
                      className={actionBtn}
                      onClick={() => toggleRequired(item)}
                      title={
                        item.required === false
                          ? "Optional — click to make required"
                          : "Required — click to make optional"
                      }
                    >
                      <i
                        className={`fa-solid ${
                          item.required === false ? "fa-circle-half-stroke" : "fa-asterisk"
                        } text-xs`}
                      ></i>
                    </button>
                  )}
                  <button
                    className={actionBtn}
                    onClick={() => {
                      if (isPath) {
                        setEditingPath(item);
                        setPathModalOpen(true);
                        return;
                      }
                      // Edit is always flat/home-course-scoped — a lesson
                      // referenced from another course edits in its own home.
                      const editCourseId = pathId ? item.homeCourse?._id || courseId : courseId;
                      navigate(`/dashboard/courses/${editCourseId}/lessons/${item._id}/edit`);
                    }}
                    title={isPath ? "Edit path" : "Edit lesson"}
                  >
                    <i className="fa fa-edit text-xs"></i>
                  </button>
                  <button
                    className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`}
                    onClick={() => handleDelete(item)}
                    title={isPath ? "Delete path" : pathId ? "Remove from path" : "Delete lesson"}
                  >
                    <i className={`fa ${pathId && !isPath ? "fa-circle-minus" : "fa-trash"} text-xs`}></i>
                  </button>
                  {isPath && (
                    <i className="fa-solid fa-chevron-right text-[10px] text-brand-muted ml-1"></i>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PathFormModal
        isOpen={pathModalOpen}
        onClose={() => setPathModalOpen(false)}
        courseId={courseId}
        path={editingPath}
        onSaved={loadCurriculum}
      />

      {pathId && (
        <LessonPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          courseId={courseId}
          pathId={pathId}
          existingLessonIds={items.map((i) => i._id)}
          onAdded={loadCurriculum}
        />
      )}
    </div>
  );
}
