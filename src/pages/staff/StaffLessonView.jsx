import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate,Link } from "react-router-dom";
import api from "../../api/api";

export default function StaffLessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD COURSE CONTENT ================= */
  const loadCourseContent = async () => {
    const res = await api.get(
      `/progress/me/assigned-courses/${courseId}/content`
    );
    setCourseData(res.data);
  };

  /* ================= LOAD STAFF PROGRESS ================= */
  const loadProgress = async () => {
    const res = await api.get(
      `/progress/staff?hasCourses=true&page=1&limit=15`
    );

    const staffList = res.data?.staffProgress || [];

    if (!staffList.length) return;

    // Since this is logged-in staff, first object is current staff
    const currentStaff = staffList[0];

    const matchedCourse = currentStaff.courses.find(
      (c) => c.course._id === courseId
    );

    setProgressData(matchedCourse || null);
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadCourseContent(),
          loadProgress(),
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [courseId]);

  /* ================= FLATTEN LESSONS ================= */
  const allLessons = useMemo(() => {
    if (!courseData?.modules) return [];

    return courseData.modules.flatMap(
      (m) => m.lessons || []
    );
  }, [courseData]);

  const currentLesson = allLessons.find(
    (l) => l._id === lessonId
  );

  /* ================= PROGRESS VALUES ================= */

  const progressPercent =
    progressData?.progressPercent || 0;

  const completedLessonsCount =
    progressData?.completedLessons || 0;

  /* ================= DETERMINE COMPLETED LESSON IDS ================= */

  const completedLessonIds = useMemo(() => {
    if (!completedLessonsCount) return [];

    // Mark first N lessons as completed
    return allLessons
      .slice(0, completedLessonsCount)
      .map((l) => l._id);
  }, [allLessons, completedLessonsCount]);

  /* ================= COMPLETE LESSON ================= */

  const handleComplete = async () => {
    try {
      await api.post(
        `/progress/lessons/${lessonId}/complete`
      );

      await loadProgress(); // refresh percent

    } catch (err) {
      console.error(err);
    }
  };

  /* ================= YOUTUBE EMBED FIX ================= */

  const getVideoEmbedUrl = (url) => {
    if (!url) return "";

    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  };

  /* ================= RENDER ================= */

  if (loading)
    return <div className="mx-wd py-5">Loading...</div>;

  if (!currentLesson)
    return <div className="mx-wd py-5">Lesson not found</div>;

  return (
    <div className="mx-wd les-vw">

      {/* ================= HEADER ================= */}
      <div className="about-image-grid dash-tp">
        <div className="prof">
          <h3 className="prof-name">
            {currentLesson.title}
          </h3>
          <p className="prof-em my-2">
            Lesson Progress Overview
          </p>
        </div>

        <div className="experience-badge">
          <span className="years">
            {progressPercent}%
          </span>
          <span className="text">
            Course Completed
          </span>
        </div>
      </div>

      {/* ================= LESSON GRID ================= */}
      <section className="stats section mt-4">
        <div className="mx-wd">
          <h3 className="st-tl">
            All Lessons
          </h3>

          <div className="crd-wp">

            {allLessons.map((lesson, index) => {
              const isActive =
                lesson._id === lessonId;

              const isCompleted =
                completedLessonIds.includes(
                  lesson._id
                );

              return (
                <div
                  key={lesson._id}
                  className="col-md-3 col-12"
                >
                  <div
                    className="datcard"
                    onClick={() =>
                      navigate(
                        `/dashboard/staff/course/${courseId}/lesson/${lesson._id}`
                      )
                    }
                    style={{
                      cursor: "pointer",
                      border: isActive
                        ? "2px solid #198754"
                        : "1px solid #eee",
                      opacity: isCompleted ? 1 : 0.9,
                    }}
                  >
                    <div className="fplogo">

                      <i className="fa-solid fa-book-open-reader fa-2x mn-ic"></i>

                      <h2 className="mod-tl">
                        {lesson.title}
                      </h2>

                      <p>Lesson {index + 1}</p>

                      {isCompleted && (
                        <div className="hero-tag">
                          <i className="bi bi-check-circle"></i>
                        </div>
                      )}

                      <div className="go-corner"></div>

                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* ================= CONTENT ================= */}
      <div className="about-showcase mt-4">
        <div className="about-content-box">

         {currentLesson.blocks?.map((block) => {
          if (block.type === "text") {
            return (
              <div
                key={block._id}
                dangerouslySetInnerHTML={{
                  __html: block.contentText || "",
                }}
              />
            );
          }

          if (block.type === "image") {
            return (
              <img
                key={block._id}
                src={`${import.meta.env.VITE_API_URL}/files/${block.storageKey}`}
                alt={block.fileName}
                style={{ width: "100%", marginBottom: "15px" }}
              />
            );
          }

          if (block.type === "video") {
            return (
              <iframe
                key={block._id}
                width="100%"
                height="450"
                src={getVideoEmbedUrl(block.contentUrl)}
                title="Lesson Video"
                allowFullScreen
              />
            );
          }

          return null;
        })}

          <div className="d-flex justify-content-end mt-4">
            <Link to="/dashboard"
              className="logout-btn"
              onClick={handleComplete}
            >
              Complete Lesson
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}