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
import CoursePickerModal from "../../components/dashboard/CoursePickerModal";
import CoursePathFormModal from "../../components/dashboard/CoursePathFormModal";
import { getCourseColor } from "../../utils/courseColor";

const actionBtn =
  "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

/**
 * One course inside a path. Always draggable — a path's ordering IS its array
 * position (unlike course-level curriculum, which shares a resequenced number
 * space across two collections).
 */
function SortableCourseRow({ item, position, onToggleRequired, onRemove, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(item._id) });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-canvas ${
        isDragging ? "opacity-60 bg-canvas relative z-10" : ""
      }`}
    >
      <button
        type="button"
        className="flex items-center justify-center w-6 h-7 -ml-1 text-brand-muted hover:text-brand-text cursor-grab active:cursor-grabbing flex-shrink-0"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <i className="fa-solid fa-grip-vertical text-xs"></i>
      </button>

      <span className="w-7 h-7 flex items-center justify-center rounded-md bg-canvas border border-brand-border text-xs font-bold text-brand-muted flex-shrink-0">
        {position}
      </span>

      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
        style={{ backgroundColor: getCourseColor() }}
      >
        {item.title?.slice(0, 2).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-text truncate">{item.title}</p>
        <p className="text-[11px] text-brand-muted">
          {item.lessonCount} lesson{item.lessonCount === 1 ? "" : "s"}
          {item.status !== "published" ? " · Draft" : ""}
          {item.required === false ? " · Optional" : ""}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
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
        <button
          type="button"
          className={actionBtn}
          onClick={() => onOpen(item)}
          title="Open this course's lessons"
        >
          <i className="fa-solid fa-folder-open text-xs"></i>
        </button>
        <button
          type="button"
          className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`}
          onClick={() => onRemove(item)}
          title="Remove from path"
        >
          <i className="fa fa-circle-minus text-xs"></i>
        </button>
      </div>
    </div>
  );
}

export default function PathCourses() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/paths/${pathId}`);
      setPath(res.data.path || null);
      setItems(res.data.items || []);
    } catch {
      toastr.error("Failed to load path");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => String(i._id) === active.id);
    const newIndex = items.findIndex((i) => String(i._id) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await api.patch(`/paths/${pathId}/courses/reorder`, {
        courseIds: reordered.map((i) => String(i._id)),
      });
    } catch (err) {
      setItems(previous);
      toastr.error(err.response?.data?.error || "Could not save the new order");
      load();
    }
  };

  const toggleRequired = async (course) => {
    try {
      await api.patch(`/paths/${pathId}/courses/${course._id}`, {
        required: course.required === false,
      });
      load();
    } catch {
      toastr.error("Failed to update course");
    }
  };

  const removeCourse = async (course) => {
    if (
      !window.confirm(
        `Remove "${course.title}" from this path? The course itself is not deleted, and anyone assigned it separately keeps it.`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/paths/${pathId}/courses/${course._id}`);
      toastr.success("Removed from path");
      load();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to remove course");
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await api.patch(`/paths/${pathId}/publish`);
      toastr.success("Path published");
      load();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const published = path?.status === "published";

  return (
    <div className="space-y-5">
      <PageHeader
        title={path?.title || "Path"}
        subtitle="Courses in this path, in order — drag to rearrange"
      >
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-list-check text-xs" />}
          onClick={() => setPickerOpen(true)}
        >
          Add existing courses
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          // Creating from here returns to this path with the new course added.
          onClick={() => navigate(`/dashboard/course-add?pathId=${pathId}`)}
        >
          Create new course
        </Button>
        {published ? (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<i className="fa-solid fa-user-plus text-xs" />}
            onClick={() => navigate(`/dashboard/paths/${pathId}/assign`)}
          >
            Assign
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={publishing}
            leadingIcon={<i className="fa-solid fa-rocket text-xs" />}
            onClick={handlePublish}
          >
            Publish Path
          </Button>
        )}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
          title="Edit path"
          onClick={() => setEditOpen(true)}
        >
          <i className="fa fa-edit text-xs"></i>
        </button>
        <Link
          to="/dashboard/courses"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {path && (
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold ${
              published
                ? "bg-emerald/10 text-emerald"
                : "bg-canvas border border-brand-border text-brand-muted"
            }`}
          >
            <i className={`fa-solid ${published ? "fa-circle-check" : "fa-pen-ruler"} text-[10px]`} />
            {published ? "Published" : "Draft"}
          </span>
          {path.sequentialUnlock && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas border border-brand-border text-brand-muted font-semibold">
              <i className="fa-solid fa-lock text-[10px]" />
              Unlocks in order
            </span>
          )}
          {path.certificate?.enabled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas border border-brand-border text-brand-muted font-semibold">
              <i className="fa-solid fa-award text-[10px]" />
              Path certificate
            </span>
          )}
          {path.enrolledCount > 0 && (
            <span className="text-brand-muted">{path.enrolledCount} enrolled</span>
          )}
        </div>
      )}

      {loading ? (
        <SectionLoader />
      ) : items.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-folder-open text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">
            No courses in this path yet. Add existing courses or create a new one.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-brand-border rounded-xl divide-y divide-brand-border">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => String(i._id))}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, i) => (
                <SortableCourseRow
                  key={String(item._id)}
                  item={item}
                  position={i + 1}
                  onToggleRequired={toggleRequired}
                  onRemove={removeCourse}
                  onOpen={(c) => navigate(`/dashboard/courses/${c._id}/lessons`)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      <CoursePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pathId={pathId}
        existingCourseIds={items.map((i) => i._id)}
        onAdded={load}
      />

      <CoursePathFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        path={path}
        onSaved={load}
      />
    </div>
  );
}
