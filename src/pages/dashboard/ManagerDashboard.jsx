import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  Button,
  SkeletonCard,
  EmptyState,
} from "../../components/ui";

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

  return (
    <div className="space-y-6">
      <PageHeader title="Manager Dashboard" subtitle="Staff training performance overview">
        <span className="text-3xl font-bold text-white tabular-nums">
          {avgProgress}%
          <span className="text-sm font-normal text-white/60 ml-1">avg</span>
        </span>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: "fa-users", label: "Total Staff", value: totalStaff },
            { icon: "fa-chart-line", label: "Avg Completion", value: `${avgProgress}%` },
            { icon: "fa-triangle-exclamation", label: "Overdue Courses", value: totalOverdue, danger: true },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <div>
        <h2 className="text-subheading text-brand-text mb-4">Staff & Their Progress</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : staffData.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={<i className="fa-solid fa-user-group" />}
              title="No staff to show"
              description="Once staff are added and tracked, they will appear here."
            />
          </Card>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {staffData.map((staff) => (
              <motion.div
                key={staff.staffId}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card
                  interactive
                  onClick={() => navigate(`/dashboard/staff-progress/${staff.staffId}`)}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-brand-text leading-tight truncate">
                        {staff.staffName}
                      </p>
                      <p className="text-caption text-brand-muted truncate">{staff.staffEmail}</p>
                    </div>
                    <span className="text-body font-bold text-emerald-hover flex-shrink-0 tabular-nums">
                      {staff.avgProgressPercent}%
                    </span>
                  </div>

                  <div className="h-1.5 bg-brand-border rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full bg-emerald rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${staff.avgProgressPercent}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="neutral" size="sm">
                      {staff.trackedCourses} courses
                    </Badge>
                    {staff.overdueCourses > 0 && (
                      <Badge tone="danger" dot size="sm">
                        {staff.overdueCourses} overdue
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 1}
          leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-caption text-brand-muted">Page {pagination.page || 1}</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={pagination.total ? page * pagination.limit >= pagination.total : true}
          trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
