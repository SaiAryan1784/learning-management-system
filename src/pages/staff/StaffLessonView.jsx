import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";

export default function StaffLessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCourseContent = async () => {
    const res = await api.get(`/progress/me/assigned-courses/${courseId}/content`);
    setCourseData(res.data);
  };

  const loadProgress = async () => {
    const res = await api.get(`/progress/staff?hasCourses=true&page=1&limit=15`);
    const staffList = res.data?.staffProgress || [];
    if (!staffList.length) return;
    const matchedCourse = staffList[0].courses.find((c) => c.course._id === courseId);
    setProgressData(matchedCourse || null);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        await Promise.all([loadCourseContent(), loadProgress()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [courseId]);

  const allLessons = useMemo(() => {
    if (!courseData?.modules) return [];
    return courseData.modules.flatMap((m) => m.lessons || []);
  }, [courseData]);

  const currentLesson = allLessons.find((l) => l._id === lessonId);
  const progressPercent = progressData?.progressPercent || 0;
  const completedLessonsCount = progressData?.completedLessons || 0;
  const completedLessonIds = useMemo(
    () => allLessons.slice(0, completedLessonsCount).map((l) => l._id),
    [allLessons, completedLessonsCount]
  );

  const handleComplete = async () => {
    try {
      await api.post(`/progress/lessons/${lessonId}/complete`);
      await loadProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch")) return `https://www.youtube.com/embed/${url.split("v=")[1]?.split("&")[0]}`;
    if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
    return url;
  };

  if (loading) return <p className="text-brand-muted text-sm p-6">Loading...</p>;
  if (!currentLesson) return <p className="text-brand-muted text-sm p-6">Lesson not found.</p>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-charcoal rounded-xl px-5 py-4">
        <div>
          <h1 className="text-xl font-semibold text-white uppercase tracking-wide">{currentLesson.title}</h1>
          <p className="text-sm text-white/60 mt-0.5">Lesson Progress Overview</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald/10 border border-emerald/20 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-emerald">{progressPercent}%</span>
          <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">Completed</span>
        </div>
      </div>

      {/* All Lessons grid */}
      <div className="bg-surface border border-brand-border rounded-xl p-5">
        <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-4">All Lessons</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allLessons.map((lesson, index) => {
            const isActive = lesson._id === lessonId;
            const isCompleted = completedLessonIds.includes(lesson._id);
            return (
              <div
                key={lesson._id}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  isActive
                    ? "border-emerald bg-emerald/5"
                    : isCompleted
                    ? "border-emerald/30 bg-emerald/5"
                    : "border-brand-border hover:border-emerald/30"
                }`}
                onClick={() => navigate(`/dashboard/staff/course/${courseId}/lesson/${lesson._id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-brand-muted uppercase">Lesson {index + 1}</span>
                  {isCompleted && <i className="fa-solid fa-circle-check text-emerald text-xs"></i>}
                </div>
                <p className="text-xs font-medium text-brand-text line-clamp-2">{lesson.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-surface border border-brand-border rounded-xl p-6">
        {currentLesson.blocks?.map((block) => {
          if (block.type === "text") {
            return (
              <div key={block._id} className="prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{ __html: block.contentText || "" }} />
            );
          }
          if (block.type === "image") {
            return (
              <img
                key={block._id}
                src={`${import.meta.env.VITE_API_URL}/files/${block.storageKey}`}
                alt={block.fileName}
                className="w-full rounded-xl mb-4"
              />
            );
          }
          if (block.type === "video") {
            return (
              <iframe
                key={block._id}
                className="w-full rounded-xl mb-4"
                height="450"
                src={getVideoEmbedUrl(block.contentUrl)}
                title="Lesson Video"
                allowFullScreen
              />
            );
          }
          return null;
        })}

        <div className="flex justify-end pt-4 border-t border-brand-border">
          <Link
            to="/dashboard"
            className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
            onClick={handleComplete}
          >
            <i className="fa-solid fa-check text-xs mr-1.5"></i>
            Complete Lesson
          </Link>
        </div>
      </div>
    </div>
  );
}
