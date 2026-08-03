import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const OPTION_ICON = {
  resource: "fa-file-lines",
  guide: "fa-book-open",
  quiz: "fa-clipboard-question",
};

/**
 * WorkRamp-style "Add Content" picker: every course in the org as a
 * collapsible folder, its lessons underneath with a checkbox each, multi-select
 * across courses, add them all to the current path in one call.
 */
export default function LessonPickerModal({
  isOpen,
  onClose,
  courseId,
  pathId,
  existingLessonIds = [],
  onAdded,
}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [adding, setAdding] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const debounceRef = useRef(null);

  const existingSet = useMemo(
    () => new Set(existingLessonIds.map(String)),
    [existingLessonIds],
  );

  const load = async (q) => {
    try {
      setLoading(true);
      const res = await api.get("/courses/lesson-picker", q ? { params: { q } } : {});
      const list = res.data.courses || [];
      setCourses(list);
      setTruncated(Boolean(res.data.truncated));
      // The server already filtered to matches when searching, so open
      // every returned course; otherwise leave folders collapsed.
      if (q) setExpanded(Object.fromEntries(list.map((c) => [c._id, true])));
    } catch {
      toastr.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setSelectedIds([]);
    setExpanded({});
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId, pathId]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(search), 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectableIds = (course) =>
    course.lessons.filter((l) => !existingSet.has(String(l._id))).map((l) => String(l._id));

  const toggleLesson = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleCourseAll = (course) => {
    const ids = selectableIds(course);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])],
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    try {
      setAdding(true);
      await api.post(`/courses/${courseId}/paths/${pathId}/lessons`, {
        lessonIds: selectedIds,
      });
      toastr.success(`Added ${selectedIds.length} lesson${selectedIds.length === 1 ? "" : "s"}`);
      onAdded?.();
      onClose?.();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to add lessons");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add existing lessons"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full gap-4">
          <span className="text-[11px] text-brand-muted truncate">
            {truncated ? "Showing partial results — refine your search" : ""}
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
              Add ({selectedIds.length})
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
          placeholder="Search courses or lessons…"
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
          autoFocus
        />

        <div className="max-h-[60vh] overflow-y-auto border border-brand-border rounded-lg bg-canvas p-3 space-y-3">
          {loading ? (
            <p className="text-sm text-brand-muted text-center py-6">Loading…</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-6">No lessons found.</p>
          ) : (
            courses.map((course) => {
              const ids = selectableIds(course);
              const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
              const isOpenGroup = expanded[course._id] ?? false;

              return (
                <div
                  key={course._id}
                  className="border border-brand-border rounded-lg bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-canvas">
                    <button
                      type="button"
                      className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 p-0"
                      onClick={() => toggleExpand(course._id)}
                    >
                      <i
                        className={`fa-solid fa-chevron-${isOpenGroup ? "down" : "right"} text-[10px] text-brand-muted flex-shrink-0`}
                      ></i>
                      <i className="fa-solid fa-folder text-emerald text-xs flex-shrink-0"></i>
                      <span className="text-sm font-medium text-brand-text truncate">
                        {course.title}
                      </span>
                      <span className="text-[11px] text-brand-muted flex-shrink-0">
                        {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
                      </span>
                    </button>
                    {ids.length > 0 && (
                      <label className="flex items-center gap-1.5 text-[11px] text-brand-muted cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="w-3 h-3 accent-emerald"
                          checked={allSelected}
                          onChange={() => toggleCourseAll(course)}
                        />
                        Select all
                      </label>
                    )}
                  </div>

                  {isOpenGroup && (
                    <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {course.lessons.length === 0 ? (
                        <p className="text-[11px] text-brand-muted py-1 col-span-2">
                          No lessons in this course.
                        </p>
                      ) : (
                        course.lessons.map((lesson) => {
                          const already = existingSet.has(String(lesson._id));
                          return (
                            <label
                              key={lesson._id}
                              className={`flex items-center gap-2 text-xs py-1 ${
                                already
                                  ? "text-brand-muted cursor-not-allowed"
                                  : "text-brand-text cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 accent-emerald"
                                checked={already || selectedIds.includes(String(lesson._id))}
                                disabled={already}
                                onChange={() => toggleLesson(String(lesson._id))}
                              />
                              <i
                                className={`fa-solid ${OPTION_ICON[lesson.option] || "fa-file-lines"} text-[10px] flex-shrink-0`}
                              ></i>
                              <span className="truncate">{lesson.title}</span>
                              {already && (
                                <span className="text-[10px] flex-shrink-0">(Added)</span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
