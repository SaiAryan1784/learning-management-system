import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { PageLoader } from "../../components/ui/Spinner";

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
      const res = await api.get(`/progress/staff?page=${page}&limit=10`);
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
      ? Math.round(staffData.reduce((acc, s) => acc + s.avgProgressPercent, 0) / totalStaff)
      : 0;
  const totalOverdue = staffData.reduce((acc, s) => acc + s.overdueCourses, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Manager Dashboard" subtitle="Staff training performance overview">
        <span className="text-3xl font-bold text-white">
          {avgProgress}%
          <span className="text-sm font-normal text-white/60 ml-1">avg</span>
        </span>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="fa-users" label="Total Staff" value={totalStaff} />
        <StatCard icon="fa-chart-line" label="Avg Completion" value={`${avgProgress}%`} />
        <StatCard icon="fa-triangle-exclamation" label="Overdue Courses" value={totalOverdue} danger />
      </div>

      {/* Staff Progress Cards */}
      <div>
        <h2 className="text-lg font-semibold text-brand-text mb-4">Staff & Their Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staffData.map((staff) => (
            <div
              key={staff.staffId}
              className="bg-surface border border-brand-border rounded-xl p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-brand-text leading-tight pr-2">
                  {staff.staffName}
                </span>
                <span className="text-sm font-bold text-emerald flex-shrink-0">
                  {staff.avgProgressPercent}%
                </span>
              </div>

              <div className="h-1.5 bg-brand-border rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald rounded-full transition-all duration-500"
                  style={{ width: `${staff.avgProgressPercent}%` }}
                />
              </div>

              <p className="text-xs text-brand-muted">
                {staff.staffEmail} • {staff.trackedCourses} Courses •{" "}
                <span className={staff.overdueCourses > 0 ? "text-brand-danger" : ""}>
                  {staff.overdueCourses} Overdue
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-2">
        <button
          className="px-4 py-2 bg-surface border border-brand-border text-sm font-medium text-brand-text rounded-lg hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-brand-muted">Page {pagination.page}</span>
        <button
          className="px-4 py-2 bg-surface border border-brand-border text-sm font-medium text-brand-text rounded-lg hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={page * pagination.limit >= pagination.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

    </div>
  );
}
