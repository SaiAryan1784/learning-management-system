import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Button, Badge, Card } from "../../components/ui";

export default function StaffLessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

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

  const currentIndex = allLessons.findIndex((l) => l._id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await api.post(`/progress/lessons/${lessonId}/complete`);
      await loadProgress();
      if (nextLesson) {
        navigate(`/dashboard/staff/course/${courseId}/lesson/${nextLesson._id}`);
      } else {
        navigate("/dashboard/my-dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch")) return `https://www.youtube.com/embed/${url.split("v=")[1]?.split("&")[0]}`;
    if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
    return url;
  };

  if (loading) return <PageLoader />;
  if (!currentLesson) return <p className="text-brand-muted text-body p-6">Lesson not found.</p>;

  return (
    <div className="space-y-5">
      {/* Sticky progress bar */}
      <div className="sticky top-14 z-30 -mx-6 px-6 py-3 bg-canvas/95 backdrop-blur border-b border-brand-border">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="min-w-0">
            <p className="text-caption text-brand-muted uppercase tracking-wide">Course Progress</p>
            <p className="text-body font-semibold text-brand-text truncate">
              Lesson {currentIndex + 1} of {allLessons.length}
            </p>
          </div>
          <Badge tone={progressPercent === 100 ? "success" : "info"} size="lg">
            {progressPercent}%
          </Badge>
        </div>
        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-emerald rounded-full"
          />
        </div>
      </div>

      <Card padded>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-heading text-brand-text">{currentLesson.title}</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allLessons.map((lesson, index) => {
            const isActive = lesson._id === lessonId;
            const isCompleted = completedLessonIds.includes(lesson._id);
            return (
              <motion.button
                key={lesson._id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`text-left p-3 rounded-xl border transition-colors relative ${
                  isActive
                    ? "border-emerald bg-emerald-muted shadow-soft"
                    : isCompleted
                    ? "border-emerald/30 bg-emerald-muted/60"
                    : "border-brand-border hover:border-emerald/40 bg-surface"
                }`}
                onClick={() => navigate(`/dashboard/staff/course/${courseId}/lesson/${lesson._id}`)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-brand-muted uppercase">
                    Lesson {index + 1}
                  </span>
                  {isCompleted && <i className="fa-solid fa-circle-check text-emerald text-xs"></i>}
                </div>
                <p className="text-caption font-medium text-brand-text line-clamp-2">{lesson.title}</p>
              </motion.button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={lessonId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card padded className="!p-6">
            {currentLesson.blocks?.map((block) => {
              if (block.type === "text") {
                return (
                  <div
                    key={block._id}
                    className="prose prose-sm max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: block.contentText || "" }}
                  />
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

            <div className="flex items-center justify-between gap-3 pt-5 mt-2 border-t border-brand-border">
              <Button
                variant="ghost"
                disabled={!prevLesson}
                leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
                onClick={() =>
                  prevLesson &&
                  navigate(`/dashboard/staff/course/${courseId}/lesson/${prevLesson._id}`)
                }
              >
                Previous
              </Button>
              <Button
                variant="primary"
                loading={completing}
                trailingIcon={<i className="fa-solid fa-check text-xs" />}
                onClick={handleComplete}
              >
                {nextLesson ? "Complete & Next" : "Complete Lesson"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
