import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import AOS from "aos";
import "aos/dist/aos.css";

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH DASHBOARD =================
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/progress/me/dashboard", {
        params: { t: Date.now() },
      });

      setSummary(res.data.summary);
      setCourses(res.data.courses);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const handleFocus = () => fetchDashboard();
    window.addEventListener("focus", handleFocus);
    return () =>
      window.removeEventListener("focus", handleFocus);
  }, [fetchDashboard]);

  // ================= START / RESUME =================
  const handleStartOrResume = async (course) => {
    try {
      if (!course?.courseId || course.totalLessons === 0)
        return;

      const res = await api.get(
        `/progress/courses/${course.courseId}/resume`,
        { params: { t: Date.now() } }
      );

      const lessonId =
        res.data?.resumeLesson?._id;

      if (!lessonId) return;

      navigate(
        `/dashboard/staff/course/${course.courseId}/lesson/${lessonId}`
      );
    } catch (err) {
      console.error("Resume failed", err);
    }
  };

  const getButtonText = (course) => {
    if (course.totalLessons === 0)
      return "No Lessons Available";
    if (course.progressPercent === 100)
      return "Review Course";
    if (course.progressPercent > 0)
      return "Resume Course";
    return "Start Course";
  };

  if (loading)
    return (
      <div className="mx-wd py-5">
        Loading dashboard...
      </div>
    );

  return (
    <div className="mx-wd">

      {/* ================= HEADER ================= */}

      <div className="about-image-grid dash-tp">
        <div className="prof">
          <h3 className="prof-name">
            Welcome Back 👋
          </h3>
          <p className="prof-em my-2">
            Track your learning progress &
            achievements
          </p>
        </div>

        <div className="experience-badge">
          <span className="years">
            {summary?.completedCourses || 0}
          </span>
          <span className="text">
            Courses Completed
          </span>
        </div>
      </div>

      {/* ================= STATS ================= */}

      {summary && (
        <section id="stats" className="stats section">
          <div className="mx-wd">

            <div className="col-lg-12 col-md-12">
              <div className="stats-overview text-center text-lg-start">
                <h3>Your Learning Overview</h3>
                <p>
                  Real-time summary of your
                  assigned courses and progress.
                </p>
              </div>
            </div>

            <div className="col-lg-12 col-md-12">
              <div className="stats-grid">

                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-journal-bookmark-fill"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {summary.totalAssignedCourses}
                      <span className="plus">+</span>
                    </div>
                    <p>Total Courses</p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {summary.completedCourses}
                      <span className="plus">+</span>
                    </div>
                    <p>Completed</p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {summary.inProgressCourses}
                      <span className="plus">+</span>
                    </div>
                    <p>In Progress</p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-pause-circle-fill"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {summary.notStartedCourses}
                      <span className="plus">+</span>
                    </div>
                    <p>Not Started</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>
      )}

      {/* ================= COURSE LIST ================= */}

      {courses.length > 0 && (
        <div className="align-items-center about-showcase">
          <div className="mx-wd col-lg-12 order-lg-1">

            <div className="about-content-box">
              <h2 className="st-tl">
                Your Assigned Courses
              </h2>

              <div className="prog-rw">

                {courses.map((course) => (
                  <div
                    key={course.courseId}
                    className="progress-item"
                    data-aos="fade-up"
                  >

                    <div className="d-flex justify-content-between">
                      <span className="progress-title">
                        {course.title}
                      </span>
                      <span className="progress-percent">
                        {course.progressPercent}%
                      </span>
                    </div>

                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${course.progressPercent}%`,
                        }}
                      ></div>
                    </div>

                    <small className="text-muted d-block mb-2">
                      {course.completedLessons} /{" "}
                      {course.totalLessons} Lessons
                      {course.dueDate && (
                        <>
                          {" "}• Due:{" "}
                          {new Date(
                            course.dueDate
                          ).toLocaleDateString()}
                        </>
                      )}
                    </small>

                    <button
                      className="snd-btn mt-2"
                      disabled={
                        course.totalLessons === 0
                      }
                      onClick={() =>
                        handleStartOrResume(course)
                      }
                    >
                      {getButtonText(course)}
                    </button>

                  </div>
                ))}

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}