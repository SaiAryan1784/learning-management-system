import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import PathFormModal from "../../components/dashboard/PathFormModal";
import LessonPickerModal from "../../components/dashboard/LessonPickerModal";

const OPTION_META = {
  resource: { label: "Resource", icon: "fa-file-lines", tone: "bg-blue-100 text-blue-600" },
  // Label deliberately NOT "Guide": that word now means the container.
  guide: { label: "Material + Q", icon: "fa-book-open", tone: "bg-violet-100 text-violet-600" },
  quiz: { label: "Quiz", icon: "fa-clipboard-question", tone: "bg-amber-100 text-amber-600" },
};

// Kept separate from OPTION_META on purpose: that map is keyed by lesson.option,
// so folding the container type into it would invite a wrong-key lookup
// rendering a blank badge. (`kind: "path"` is the API's wording; the UI calls
// the same thing a Guide — a topic made of ordered pages.)
const GUIDE_META = {
  label: "Guide",
  icon: "fa-folder-tree",
  tone: "bg-emerald/10 text-emerald",
};

const actionBtn =
  "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

/**
 * One curriculum row — a lesson/page, or a guide container.
 *
 * `dragHandle` is rendered only inside a guide, where the order is the path's
 * array position and therefore reorderable. At course level the order is a
 * shared 1..n number space across two collections, resequenced server-side,
 * so rows there stay static and show their number instead.
 */
function CurriculumRow({
  item,
  pathId,
  onOpenGuide,
  onEdit,
  onDelete,
  onToggleRequired,
  dragHandle = null,
  style,
  innerRef,
  extraClass = "",
}) {
  const isGuide = item.kind === "path";
  const meta = isGuide ? GUIDE_META : OPTION_META[item.option] || OPTION_META.resource;
  const inGuide = Boolean(pathId);

  return (
    <div
      ref={innerRef}
      style={style}
      role={isGuide ? "button" : undefined}
      tabIndex={isGuide ? 0 : undefined}
      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
        isGuide ? "hover:bg-emerald/5 cursor-pointer" : "hover:bg-canvas"
      } ${extraClass}`}
      onClick={isGuide ? () => onOpenGuide(item) : undefined}
      onKeyDown={
        isGuide
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenGuide(item);
              }
            }
          : undefined
      }
    >
      {dragHandle}

      {/* Guide-referenced lessons carry no `order` — a guide's ordering is its
          array position, not a number. */}
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
          {isGuide ? (
            <>
              {item.lessonCount} page{item.lessonCount === 1 ? "" : "s"}
              {item.sequentialUnlock ? " · Unlocks in order" : ""}
            </>
          ) : (
            <>
              {item.blockCount ?? item.blocks?.length ?? 0} fields
              {item.required === false ? " · Optional" : ""}
            </>
          )}
        </p>
      </div>

      <div
        className="flex items-center gap-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        {!isGuide && (
          <button
            type="button"
            className={actionBtn}
            onClick={() => onToggleRequired(item)}
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
          type="button"
          className={actionBtn}
          onClick={() => onEdit(item)}
          title={isGuide ? "Edit guide" : inGuide ? "Edit page" : "Edit lesson"}
        >
          <i className="fa fa-edit text-xs"></i>
        </button>
        <button
          type="button"
          className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`}
          onClick={() => onDelete(item)}
          title={isGuide ? "Delete guide" : inGuide ? "Remove from guide" : "Delete lesson"}
        >
          <i className={`fa ${inGuide && !isGuide ? "fa-circle-minus" : "fa-trash"} text-xs`}></i>
        </button>
        {isGuide && (
          <i className="fa-solid fa-chevron-right text-[10px] text-brand-muted ml-1"></i>
        )}
      </div>
    </div>
  );
}

/** Draggable variant, used only inside a guide. */
function SortableCurriculumRow(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item._id,
  });

  return (
    <CurriculumRow
      {...props}
      innerRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      extraClass={isDragging ? "opacity-60 bg-canvas relative z-10" : ""}
      dragHandle={
        <button
          type="button"
          className="flex items-center justify-center w-6 h-7 -ml-1 text-brand-muted hover:text-brand-text cursor-grab active:cursor-grabbing flex-shrink-0"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-solid fa-grip-vertical text-xs"></i>
        </button>
      }
    />
  );
}

export default function CourseLessons() {
  // pathId present = we're inside a guide, showing the pages IT REFERENCES
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  /**
   * Reorder pages within a guide. The endpoint wants the FULL ordered list, so
   * we apply the move locally first (instant feedback) and re-fetch on failure
   * rather than leaving the UI showing an order the server rejected.
   */
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await api.patch(`/courses/${courseId}/paths/${pathId}/lessons/reorder`, {
        lessonIds: reordered.map((i) => i._id),
      });
    } catch (err) {
      setItems(previous);
      toastr.error(err.response?.data?.error || "Could not save the new order");
      loadCurriculum();
    }
  };

  const removeFromPath = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from this guide? The lesson stays in its course.`)) {
      return;
    }
    try {
      await api.delete(`/courses/${courseId}/paths/${pathId}/lessons/${item._id}`);
      toastr.success("Removed from guide");
      loadCurriculum();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to remove page");
    }
  };

  const deletePath = async (item) => {
    const msg =
      item.lessonCount > 0
        ? `Delete the guide "${item.title}" and its ${item.lessonCount} page reference${item.lessonCount === 1 ? "" : "s"}? The lessons themselves stay in their courses.`
        : `Delete the empty guide "${item.title}"?`;
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/courses/${courseId}/paths/${item._id}`);
      toastr.success("Guide deleted");
      loadCurriculum();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Delete failed");
    }
  };

  // Deleting the lesson itself (not just a reference) is only ever offered at
  // its home course — doing it from inside a guide would destroy another
  // course's content. A guide referencing it that gets 409'd is asked to
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

  const handleEdit = (item) => {
    if (item.kind === "path") {
      setEditingPath(item);
      setPathModalOpen(true);
      return;
    }
    // Edit is always flat/home-course-scoped — a lesson referenced from another
    // course edits in its own home.
    const editCourseId = pathId ? item.homeCourse?._id || courseId : courseId;
    navigate(`/dashboard/courses/${editCourseId}/lessons/${item._id}/edit`);
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

  const openGuide = (item) =>
    navigate(`/dashboard/courses/${courseId}/paths/${item._id}/lessons`);

  const newLessonPath = pathId
    ? `/dashboard/courses/${courseId}/paths/${pathId}/lessons/new`
    : `/dashboard/courses/${courseId}/lessons/new`;

  const backTo = pathId
    ? `/dashboard/courses/${courseId}/lessons`
    : "/dashboard/courses";

  const rowProps = {
    pathId,
    onOpenGuide: openGuide,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleRequired: toggleRequired,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={pathId ? pathMeta?.title || "Guide" : "Lessons"}
        subtitle={
          pathId
            ? "Pages in this guide, in order — drag to rearrange"
            : "A course is a folder of lessons and guides — add and order them here"
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
              Create new page
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
            {/* No nested guides in v1 — only offered at course level. */}
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<i className="fa-solid fa-folder-plus text-xs" />}
              onClick={() => {
                setEditingPath(null);
                setPathModalOpen(true);
              }}
            >
              Add Guide
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
              ? "No pages in this guide yet. Add existing lessons or create a new page."
              : "Nothing here yet. Add a lesson, or a guide to group several pages under one topic."}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-brand-border rounded-xl divide-y divide-brand-border">
          {pathId ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i._id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableCurriculumRow key={item._id} item={item} {...rowProps} />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            items.map((item) => (
              <CurriculumRow key={item._id} item={item} {...rowProps} />
            ))
          )}
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
