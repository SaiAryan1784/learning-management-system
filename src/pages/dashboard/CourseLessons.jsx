import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import PathFormModal from "../../components/dashboard/PathFormModal";

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
  // pathId present = we're inside a path, showing only its lessons.
  const { courseId, pathId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pathMeta, setPathMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);

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

  const handleDelete = async (item) => {
    const isPath = item.kind === "path";
    const confirmMsg = isPath
      ? `Delete the path "${item.title}"?`
      : "Delete this lesson?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(
        isPath
          ? `/courses/${courseId}/paths/${item._id}`
          : `/courses/${courseId}/lessons/${item._id}`,
      );
      toastr.success(isPath ? "Path deleted" : "Lesson deleted");
      loadCurriculum();
    } catch (err) {
      // A path holding lessons comes back as a 409 with a readable reason.
      toastr.error(err.response?.data?.error || "Delete failed");
    }
  };

  const toggleRequired = async (lesson) => {
    try {
      await api.put(`/courses/${courseId}/lessons/${lesson._id}`, {
        required: !lesson.required,
      });
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
            ? "Lessons inside this path — add and order them here"
            : "A course is a folder of lessons and paths — add and order them here"
        }
      >
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={() => navigate(newLessonPath)}
        >
          Add Lesson
        </Button>

        {/* No nested paths in v1 — only offered at course level. */}
        {!pathId && (
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
              ? "No lessons in this path yet. Add one to get started."
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
                <span className="w-7 h-7 flex items-center justify-center rounded-md bg-canvas border border-brand-border text-xs font-bold text-brand-muted flex-shrink-0">
                  {item.order}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}
                >
                  <i className={`fa-solid ${meta.icon} text-[10px]`}></i>
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {item.title}
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
                    onClick={() =>
                      isPath
                        ? (setEditingPath(item), setPathModalOpen(true))
                        : navigate(
                            `/dashboard/courses/${courseId}/lessons/${item._id}/edit`,
                          )
                    }
                    title={isPath ? "Edit path" : "Edit lesson"}
                  >
                    <i className="fa fa-edit text-xs"></i>
                  </button>
                  <button
                    className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`}
                    onClick={() => handleDelete(item)}
                    title={isPath ? "Delete path" : "Delete lesson"}
                  >
                    <i className="fa fa-trash text-xs"></i>
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
    </div>
  );
}
