import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [staffData, setStaffData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchStaff();
  }, [page]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/progress/staff?page=${page}&limit=10`
      );
      setStaffData(res.data.staffProgress);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalStaff = staffData.length;

  const avgProgress =
    totalStaff > 0
      ? Math.round(
          staffData.reduce(
            (acc, s) => acc + s.avgProgressPercent,
            0
          ) / totalStaff
        )
      : 0;

  const totalOverdue = staffData.reduce(
    (acc, s) => acc + s.overdueCourses,
    0
  );

  if (loading)
    return <div className="mx-wd py-5">Loading...</div>;

  return (
    <div className="mx-wd">

      {/* ================= TOP SUMMARY HEADER ================= */}

      <div className="about-image-grid dash-tp">
        <div className="prof">
          <h3 className="prof-name">
            Manager Dashboard
          </h3>
          <p className="prof-em my-2">
            Staff training performance overview
          </p>
        </div>

        <div className="experience-badge">
          <span className="years">
            {avgProgress}%
          </span>
          <span className="text">
            Avg Completion
          </span>
        </div>
      </div>

      {/* ================= STATS SECTION ================= */}

      <section id="stats" className="stats section">
        <div className="mx-wd">

          <div className="col-lg-12 col-md-12">
            <div className="stats-overview text-center text-lg-start">
              <h3>Training Performance Overview</h3>
              <p>
                Live summary of all staff learning
                progress and overdue courses.
              </p>
            </div>
          </div>

          <div className="col-lg-12 col-md-12">
            <div className="stats-grid">

              {/* Total Staff */}
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="stats-content">
                  <p>Total Staff</p>
                  <div className="stats-number">
                    {totalStaff}
                  </div>
                </div>
              </div>

              {/* Average Progress */}
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="bi bi-graph-up"></i>
                </div>
                <div className="stats-content">
                  <p>Average Completion</p>
                  <div className="stats-number">
                    {avgProgress}
                    <span className="plus">%</span>
                  </div>
                </div>
              </div>

              {/* Overdue */}
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="bi bi-exclamation-circle"></i>
                </div>
                <div className="stats-content">
                  <p>Overdue Courses</p>

                  <div className="stats-number">
                    {totalOverdue}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= STAFF LIST ================= */}

      <div className="align-items-center about-showcase">
        <div className="mx-wd col-lg-12 order-lg-1">

          <div className="about-content-box">

            <h2 className="st-tl">
              Staff & Their Progress
            </h2>

            <div className="prog-rw">

              {staffData.map((staff) => (
                <div key={staff.staffId} className="progress-item">

                  <div className="d-flex justify-content-between">
                    <span className="progress-title">
                      {staff.staffName}
                    </span>
                    <span className="progress-percent">
                      {staff.avgProgressPercent}%
                    </span>
                  </div>

                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${staff.avgProgressPercent}%`,
                      }}
                    ></div>
                  </div>

                  <small className="text-muted d-block mb-2">
                    {staff.staffEmail} •{" "}
                    {staff.trackedCourses} Courses •{" "}
                    {staff.overdueCourses} Overdue
                  </small>

                </div>
              ))}

            </div>

            {/* ================= PAGINATION ================= */}

            <div className="d-flex justify-content-between mt-4">

              <button
                className="snd-btn"
                disabled={page === 1}
                onClick={() =>
                  setPage((p) => p - 1)
                }
              >
                Prev
              </button>

              <span>
                Page {pagination.page}
              </span>

              <button
                className="snd-btn"
                disabled={
                  page * pagination.limit >=
                  pagination.total
                }
                onClick={() =>
                  setPage((p) => p + 1)
                }
              >
                Next
              </button>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}