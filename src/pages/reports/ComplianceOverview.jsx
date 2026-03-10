import { useEffect, useState } from "react";
import api from "../../api/api";

export default function ComplianceOverview() {

  /* ================= STATES ================= */
  const [summary, setSummary] = useState({
    totalStaffTracked: 0,
    totalMandatoryAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0,
    completionRate: 0,
  });

  const [loading, setLoading] = useState(true);

  /* ================= LOAD COMPLIANCE OVERVIEW ================= */
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/compliance/overview");
      setSummary(res.data.summary || summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) return <div className="mx-wd py-5">Loading...</div>;

  /* ================= UI ================= */
  return (
    <div className="mx-wd">

      {/* ================= HEADER ================= */}
      <div className="about-image-grid dash-tp">
        <div className="prof">
          <h3 className="prof-name">Compliance Overview</h3>
          <p className="prof-em my-2">
            Summary of all compliance assignments
          </p>
        </div>

        <div className="experience-badge">
          <span className="years">{summary.completionRate}%</span>
          <span className="text">Avg Completion</span>
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}
      <section id="stats" className="stats section">
        <div className="mx-wd">

          <div className="stats-grid">

            {/* Total Staff Tracked */}
            <div className="stats-card">
              <div className="stats-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="stats-content">
                <p>Total Staff Tracked</p>
                <div className="stats-number">{summary.totalStaffTracked}</div>
              </div>
            </div>

            {/* Total Mandatory Assignments */}
            <div className="stats-card">
              <div className="stats-icon">
                <i className="bi bi-journal-check"></i>
              </div>
              <div className="stats-content">
                <p>Total Mandatory Assignments</p>
                <div className="stats-number">{summary.totalMandatoryAssignments}</div>
              </div>
            </div>

            {/* Completed Assignments */}
            <div className="stats-card">
              <div className="stats-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stats-content">
                <p>Completed Assignments</p>
                <div className="stats-number">{summary.completedAssignments}</div>
              </div>
            </div>

            {/* Overdue Assignments */}
            <div className="stats-card">
              <div className="stats-icon">
                <i className="bi bi-exclamation-circle"></i>
              </div>
              <div className="stats-content">
                <p>Overdue Assignments</p>
                <div className="stats-number">{summary.overdueAssignments}</div>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}