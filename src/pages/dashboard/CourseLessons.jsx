import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";

const OPTION_META = {
  resource: { label: "Resource", icon: "fa-file-lines", tone: "bg-blue-100 text-blue-600" },
  guide: { label: "Guide", icon: "fa-book-open", tone: "bg-violet-100 text-violet-600" },
  quiz: { label: "Quiz", icon: "fa-clipboard-question", tone: "bg-amber-100 text-amber-600" },
};

export default function CourseLessons() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const [lessonsRes, courseRes] = await Promise.all([
        api.get(`/courses/${courseId}/lessons?active=true&page=1&limit=100`),
        api.get(`/courses/${courseId}`),
      ]);
      setLessons(lessonsRes.data.lessons || []);
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
    loadLessons();
  }, [courseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await api.delete(`/courses/${courseId}/lessons/${id}`);
      toastr.success("Lesson deleted");
      loadLessons();
    } catch {
      toastr.error("Delete failed");
    }
  };

  const actionBtn =
    "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Lessons" subtitle="A course is a folder of lessons — add and order them here">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={() => navigate(`/dashboard/courses/${courseId}/lessons/new`)}
        >
          Add Lesson
        </Button>
        {!published && (
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
        {published && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald/10 text-emerald text-xs font-semibold">
            <i className="fa-solid fa-circle-check text-[10px]" />
            Published
          </span>
        )}
        <Link
          to="/dashboard/courses"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      {loading ? (
        <SectionLoader />
      ) : lessons.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-folder-open text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No lessons yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-surface border border-brand-border rounded-xl divide-y divide-brand-border">
          {lessons.map((lesson) => {
            const meta = OPTION_META[lesson.option] || OPTION_META.resource;
            return (
              <div key={lesson._id} className="flex items-center gap-4 px-4 py-3 hover:bg-canvas transition-colors">
                <span className="w-7 h-7 flex items-center justify-center rounded-md bg-canvas border border-brand-border text-xs font-bold text-brand-muted flex-shrink-0">
                  {lesson.order}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}>
                  <i className={`fa-solid ${meta.icon} text-[10px]`}></i>
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text truncate">{lesson.title}</p>
                  <p className="text-[11px] text-brand-muted">
                    {lesson.blockCount ?? lesson.blocks?.length ?? 0} fields
                    {lesson.theme?.name ? ` · Theme: ${lesson.theme.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className={actionBtn}
                    onClick={() => navigate(`/dashboard/courses/${courseId}/lessons/${lesson._id}/edit`)}
                    title="Edit lesson"
                  >
                    <i className="fa fa-edit text-xs"></i>
                  </button>
                  <button
                    className={`${actionBtn} hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger`}
                    onClick={() => handleDelete(lesson._id)}
                    title="Delete lesson"
                  >
                    <i className="fa fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
