import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

/**
 * "Add existing courses" picker for a Path — the course-level sibling of
 * `LessonPickerModal`. Flat list rather than folders: a course has no parent
 * to group it under, so there is nothing to collapse.
 */
export default function CoursePickerModal({
  isOpen,
  onClose,
  pathId,
  existingCourseIds = [],
  onAdded,
}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef(null);

  const existingSet = useMemo(
    () => new Set(existingCourseIds.map(String)),
    [existingCourseIds],
  );

  const load = async (q) => {
    try {
      setLoading(true);
      const res = await api.get("/paths/course-picker", q ? { params: { q } } : {});
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setSelectedIds([]);
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pathId]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(search), 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleCourse = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    try {
      setAdding(true);
      await api.post(`/paths/${pathId}/courses`, { courseIds: selectedIds });
      toastr.success(`Added ${selectedIds.length} course${selectedIds.length === 1 ? "" : "s"}`);
      onAdded?.();
      onClose?.();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to add courses");
    } finally {
      setAdding(false);
    }
  };

  const selectable = courses.filter((c) => !existingSet.has(String(c._id)));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add existing courses"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full gap-4">
          <span className="text-[11px] text-brand-muted truncate">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : ""}
          </span>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={adding}
              disabled={selectedIds.length === 0}
              onClick={handleAdd}
            >
              Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
        />

        {loading ? (
          <p className="text-sm text-brand-muted text-center py-6">Loading…</p>
        ) : selectable.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-6">
            {courses.length === 0
              ? "No courses found."
              : "Every course is already in this path."}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {selectable.map((course) => {
              const id = String(course._id);
              const checked = selectedIds.includes(id);
              return (
                <label
                  key={id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? "border-emerald bg-emerald-muted/50"
                      : "border-brand-border hover:bg-canvas"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCourse(id)}
                    className="w-4 h-4 rounded border-brand-border accent-emerald cursor-pointer flex-shrink-0"
                  />
                  <i className="fa-solid fa-book-open text-icon text-xs flex-shrink-0"></i>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-brand-text truncate">
                      {course.title}
                    </span>
                    <span className="block text-[11px] text-brand-muted">
                      {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
                      {course.status !== "published" ? " · Draft" : ""}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
