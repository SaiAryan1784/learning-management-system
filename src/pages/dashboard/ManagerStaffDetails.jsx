import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";

export default function ManagerStaffDetails() {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState({});

  useEffect(() => {
    loadProgress();
  }, [staffId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/progress/staff/${staffId}`);
      setStaffData(res.data);
    } catch (err) {
      console.error(err);
      toastr.error("Failed to load staff progress");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const calculateCountdown = (dueDate) => {
    if (!dueDate) return "No Due Date";

    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff <= 0) return "Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} Days Remaining`;
  };

  if (loading) return <div className="container py-5">Loading...</div>;
  if (!staffData) return <div className="container py-5">No data found.</div>;

  const { staff, courseProgress = [], lessonProgress = [] } = staffData;

  // Overall average %
  const overallPercent =
    courseProgress.length === 0
      ? 0
      : Math.round(
          courseProgress.reduce(
            (sum, c) => sum + (c.progressPercent || 0),
            0
          ) / courseProgress.length
        );

  const completedCourses = courseProgress.filter(
    (c) => c.progressPercent === 100
  ).length;

  const overdueCourses = courseProgress.filter(
    (c) => c.overdue
  ).length;

  return (
    <div className="mx-wd">
      <div className="about-image-grid dash-tp">
          <div className="prof">
            <h3 className="prof-name">{staff?.name}</h3>
            <p className="prof-em my-2">{staff?.email}</p>
          </div>
          <div className="experience-badge">
            <span className="years">{overallPercent}%</span>
            <span className="text">Overall Completion</span>
          </div>
        </div>
      <section id="stats" className="stats section">
        <div className="mx-wd">

          <div className="">

            <div className="col-lg-12 col-md-12">
              <div
                className="stats-overview text-center text-lg-start"
              >
                <h3>Training Performance Overview</h3>
                <p>
                  Live summary of staff training progress and engagement.
                </p>
              </div>
            </div>

            <div className="col-lg-12 col-md-12">
              <div
                className="stats-grid"
              >

                {/* Total Courses */}
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-folder2-open"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {courseProgress.length}
                    </div>
                    <p>Total Courses</p>
                  </div>
                </div>

                {/* Completed */}
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {completedCourses}
                    </div>
                    <p>Completed Courses</p>
                  </div>
                </div>

                {/* Overdue */}
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-exclamation-circle"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {overdueCourses}
                    </div>
                    <p>Overdue Courses</p>
                  </div>
                </div>

                {/* Overall % */}
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <div className="stats-content">
                    <div className="stats-number">
                      {overallPercent}
                      <span className="plus">%</span>
                    </div>
                    <p>Overall Completion</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
      <div className="align-items-center about-showcase">
        {/* CONTENT SIDE */}
        <div
          className="mx-wd col-lg-12 order-lg-1"
        >
          <div className="about-content-box">
            {/* COURSES PROGRESS LIST */}
            <h2 className="st-tl">Courses Assigned & It's Progress</h2>
            <div className="prog-rw">
              {courseProgress.map((course) => {
              const percent = course.progressPercent || 0;

              return (
                <div key={course._id} className="progress-item">

                  <div className="d-flex justify-content-between">
                    <span className="progress-title">
                      {course.course?.title}
                    </span>
                    <span className="progress-percent">
                      {percent}%
                    </span>
                  </div>

                  <div className="progress">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${percent}%` }}
                      aria-valuenow={percent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>

                  <small className="text-muted d-block mb-2">
                    {course.completedLessons} / {course.totalLessons} Lessons
                    • {calculateCountdown(course.dueDate)}
                  </small>

                  <button
                    className="snd-btn mt-2"
                    onClick={() => toggleExpand(course._id)}
                  >
                    {expandedCourses[course._id]
                      ? "Hide Lessons"
                      : "View Lessons"}
                  </button>

                  {/* Expand Lessons */}
                  {expandedCourses[course._id] && (
                    <div className="mt-2">
                      {lessonProgress
                        .filter(
                          (l) =>
                            l.course === course.course._id
                        )
                        .map((lesson) => (
                          <div
                            key={lesson._id}
                            className="d-flex justify-content-between small border-bottom py-1"
                          >
                            <span>{lesson.lesson?.title}</span>
                            <span
                              className={
                                lesson.status === "completed"
                                  ? "text-success"
                                  : "text-secondary"
                              }
                            >
                              {lesson.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                </div>
              );
            })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}